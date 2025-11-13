// MaskStep.tsx
import React, {
	useEffect,
	useMemo,
	useRef,
	useState,
	useImperativeHandle,
	forwardRef,
} from 'react';
import {
	View,
	TouchableOpacity,
	Dimensions,
	PanResponder,
	GestureResponderEvent,
	ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import {
	Canvas,
	Image as SkiaImage,
	useImage,
	Skia,
	ImageFormat,
	useCanvasRef,
	Rect,
	Mask as SkiaMask,
	Group,
	PaintStyle,
	BlendMode,
	AlphaType,
	ColorType,
	Path as SkiaPathComponent,
	StrokeCap,
} from '@shopify/react-native-skia';
import { ThemedText } from '../ThemedText';
import { CustomButton } from '../CustomButton';
import { FontAwesome5, Octicons } from '@expo/vector-icons';
import { StepConfig } from '../../config/stepConfig';

interface MaskStepProps {
	onMaskComplete?: (maskDataUri: string) => void;
	config: StepConfig;
	imageUri: string; // local file://, remote http(s)://, or data:image/*;base64,...
	selectedColor?: any;
	compact?: boolean;
	onHasMaskContentChange?: (hasContent: boolean) => void;
	initialMaskUri?: string; // Restore mask from previous save
}

export interface MaskStepRef {
	exportMask: () => Promise<string | undefined>;
}

type Tool = 'brush' | 'auto' | 'eraser';

const BRUSH_SIZES = [10, 20, 30, 40, 50];

interface TouchPoint {
	x: number;
	y: number;
}

export const MaskStep = forwardRef<MaskStepRef, MaskStepProps>(
	(
		{
			onMaskComplete,
			config,
			imageUri,
			selectedColor,
			compact = false,
			onHasMaskContentChange,
			initialMaskUri,
		},
		ref
	) => {
		// UI state
		const [selectedTool, setSelectedTool] = useState<Tool>('brush');
		const [brushSize, setBrushSize] = useState(30); // screen pixels
		const [isDrawing, setIsDrawing] = useState(false);

		// Auto-select options
		const [tolerance, setTolerance] = useState(28); // 0..255 color distance (Euclidean in RGB)
		const [autoSelecting, setAutoSelecting] = useState(false);

		// Skia image + mask
		const skImage = useImage(imageUri);
		const [maskSnapshot, setMaskSnapshot] = useState<ReturnType<
			typeof Skia.Image.MakeImageFromEncoded
		> | null>(null);

		// Offscreen mask surface (full-resolution)
		const maskSurfaceRef = useRef<ReturnType<typeof Skia.Surface.MakeOffscreen> | null>(null);

		// For quick on-canvas stroke preview while drawing
		const [liveStrokePath, setLiveStrokePath] = useState<ReturnType<
			typeof Skia.Path.Make
		> | null>(null);
		// Store the current scale for the live preview brush size
		const currentScaleRef = useRef<number>(1);

		// Track if mask has content (to hide helper overlay)
		const [hasMaskContent, setHasMaskContent] = useState(false);

		// Track if each tool has been used at least once
		const [hasUsedBrush, setHasUsedBrush] = useState(false);
		const [hasUsedAuto, setHasUsedAuto] = useState(false);
		const [hasUsedEraser, setHasUsedEraser] = useState(false);

		// Notify parent when mask content changes
		useEffect(() => {
			onHasMaskContentChange?.(hasMaskContent);
		}, [hasMaskContent, onHasMaskContentChange]);

		// Cleanup intervals on unmount
		useEffect(() => {
			return () => {
				if (fadeIntervalRef.current !== null) {
					clearInterval(fadeIntervalRef.current);
				}
			};
		}, []);

		// Counter to throttle mask updates during drawing
		const segmentCounterRef = useRef(0);

		// Guard to prevent concurrent surface operations
		const isSurfaceOperationInProgressRef = useRef(false);

		// Track last view coordinate for live path interpolation
		const lastViewPointRef = useRef<{ x: number; y: number } | null>(null);

		// Controls overlay state
		const [showBrushControls, setShowBrushControls] = useState(false);
		const [showToleranceControls, setShowToleranceControls] = useState(false);

		// Slider preview state
		const [isDraggingSlider, setIsDraggingSlider] = useState(false);
		const [sliderOpacity, setSliderOpacity] = useState(0);
		const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

		// Mask history for undo/redo
		const [maskHistory, setMaskHistory] = useState<
			Array<ReturnType<typeof Skia.Image.MakeImageFromEncoded> | null>
		>([]);
		const [historyIndex, setHistoryIndex] = useState(-1);
		const isHistoryActionRef = useRef(false);

		// Layout
		const screenWidth = Dimensions.get('window').width;
		const containerSize = useMemo(() => {
			const w = screenWidth - 48; // matches your padding
			return { width: w, height: w }; // square display area (like your original)
		}, [screenWidth]);

		// Mapping from view coords -> image coords (important for writing mask at native size)
		const computeFitContain = (imgW: number, imgH: number, viewW: number, viewH: number) => {
			const scale = Math.min(viewW / imgW, viewH / imgH);
			const drawW = imgW * scale;
			const drawH = imgH * scale;
			const offsetX = (viewW - drawW) / 2;
			const offsetY = (viewH - drawH) / 2;
			return { scale, offsetX, offsetY, drawW, drawH };
		};

		const mapViewToImage = (vx: number, vy: number) => {
			if (!skImage) return { ix: 0, iy: 0 };
			const imgW = skImage.width();
			const imgH = skImage.height();
			const { scale, offsetX, offsetY } = computeFitContain(
				imgW,
				imgH,
				containerSize.width,
				containerSize.height
			);

			const ix = Math.min(imgW - 1, Math.max(0, (vx - offsetX) / scale));
			const iy = Math.min(imgH - 1, Math.max(0, (vy - offsetY) / scale));
			return { ix, iy, scale };
		};

		// Create/Reset full-res black mask when image loads/changes
		useEffect(() => {
			if (!skImage) return;
			// Wait for any in-progress operations to complete
			const setupMask = async () => {
				// Wait a bit to ensure no concurrent operations
				while (isSurfaceOperationInProgressRef.current) {
					await new Promise((resolve) => setTimeout(resolve, 10));
				}

				// Offscreen mask surface at image resolution
				const imgW = skImage.width();
				const imgH = skImage.height();
				const surface = Skia.Surface.MakeOffscreen(imgW, imgH);
				maskSurfaceRef.current = surface;

				// Fill black (preserve areas). Runware expects white to be the edited area.
				try {
					isSurfaceOperationInProgressRef.current = true;
					const canvas = surface?.getCanvas();
					if (canvas) {
						// If we have an initial mask, load it, otherwise start with black
						if (initialMaskUri) {
							// Load the image from the data URI
							const base64Data = initialMaskUri.split(',')[1];
							const imageData = Skia.Data.fromBase64(base64Data);
							const initMask = Skia.Image.MakeImageFromEncoded(imageData);

							if (initMask) {
								canvas.drawImage(initMask, 0, 0);
								surface?.flush();
								const snap = surface?.makeImageSnapshot()?.makeNonTextureImage();
								if (snap) {
									setMaskSnapshot(snap);
									setHasMaskContent(true);
									setMaskHistory([snap]);
									setHistoryIndex(0);
								}
							}
						} else {
							const paint = Skia.Paint();
							paint.setColor(Skia.Color('black'));
							// PaintStyle.Fill = 0
							paint.setStyle(0);
							canvas.drawRect({ x: 0, y: 0, width: imgW, height: imgH }, paint);
							surface?.flush();
							const snap = surface?.makeImageSnapshot()?.makeNonTextureImage(); // for using on JS thread safely
							if (snap) {
								setMaskSnapshot(snap);
								// Add initial empty mask to history
								setMaskHistory([snap]);
								setHistoryIndex(0);
							}
						}
					}
				} finally {
					isSurfaceOperationInProgressRef.current = false;
				}
			};

			setupMask();
		}, [skImage, imageUri, initialMaskUri]);

		// Draw helpers (write to full-res mask) with smooth interpolation
		const drawStrokeSegmentOnMask = (
			p1: { x: number; y: number },
			p2: { x: number; y: number },
			brushImagePx: number,
			isErasing: boolean = false
		) => {
			const surface = maskSurfaceRef.current;
			if (!surface || isSurfaceOperationInProgressRef.current) return;

			// Set guard before getting canvas to make operation atomic
			// This prevents race conditions where getCanvas() is called while another operation is starting
			isSurfaceOperationInProgressRef.current = true;

			try {
				const canvas = surface.getCanvas();

				// For eraser, use DST_OUT blend mode to remove the mask
				// For brush, use white to add to the mask
				const paint = Skia.Paint();
				paint.setColor(isErasing ? Skia.Color('black') : Skia.Color('white'));
				if (isErasing) {
					// Black with DST_OUT will erase - use numeric value for v2 compatibility
					// BlendMode.DstOut = 11
					paint.setBlendMode(11);
				}
				// PaintStyle.Stroke = 1, StrokeCap.Round = 1
				paint.setStyle(1);
				paint.setStrokeWidth(Math.max(1, brushImagePx));
				paint.setStrokeCap(1);

				const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);

				// If it's a tap/start, draw a dot (line with same start/end can miss if antialiasing is off)
				if (distance < 0.001) {
					const dotPaint = Skia.Paint();
					dotPaint.setColor(isErasing ? Skia.Color('black') : Skia.Color('white'));
					if (isErasing) {
						// BlendMode.DstOut = 11
						dotPaint.setBlendMode(11);
					}
					// PaintStyle.Fill = 0
					dotPaint.setStyle(0);
					canvas.drawCircle(p1.x, p1.y, brushImagePx * 0.5, dotPaint);
				} else {
					// If points are far apart, interpolate to avoid sharp edges
					// Interpolate every ~1 pixel of distance for smooth curves
					const stepSize = 1; // pixel step for interpolation
					const numSteps = Math.ceil(distance / stepSize);

					if (numSteps > 1) {
						// Draw multiple small segments for smooth curves
						const path = Skia.Path.Make();
						path.moveTo(p1.x, p1.y);

						for (let i = 1; i <= numSteps; i++) {
							const t = i / numSteps;
							const x = p1.x + (p2.x - p1.x) * t;
							const y = p1.y + (p2.y - p1.y) * t;
							path.lineTo(x, y);
						}
						canvas.drawPath(path, paint);
					} else {
						// Draw single segment for short distances
						const path = Skia.Path.Make();
						path.moveTo(p1.x, p1.y);
						path.lineTo(p2.x, p2.y);
						canvas.drawPath(path, paint);
					}
				}

				// Don't flush during drawing - we'll flush when the stroke is complete
				// This prevents "Should not already be working" errors from concurrent operations
			} catch (e) {
				// If we can't get the canvas (operation in progress), skip this draw
				console.warn('Failed to draw stroke segment:', e);
			} finally {
				isSurfaceOperationInProgressRef.current = false;
			}
		};

		const refreshMaskSnapshot = (saveToHistory: boolean = false) => {
			const surface = maskSurfaceRef.current;
			if (!surface || isSurfaceOperationInProgressRef.current) return;

			try {
				isSurfaceOperationInProgressRef.current = true;
				surface.flush();
				const snap = surface.makeImageSnapshot()?.makeNonTextureImage();
				if (snap) {
					setMaskSnapshot(snap);
					// Save to history only when explicitly requested and not during history navigation
					if (saveToHistory && !isHistoryActionRef.current) {
						const newHistory = maskHistory.slice(0, historyIndex + 1);
						newHistory.push(snap);
						setMaskHistory(newHistory);
						setHistoryIndex(newHistory.length - 1);
					}
				}
			} finally {
				isSurfaceOperationInProgressRef.current = false;
			}
		};

		const handleUndo = () => {
			if (historyIndex > 0 && !isSurfaceOperationInProgressRef.current) {
				isHistoryActionRef.current = true;
				const newIndex = historyIndex - 1;
				setHistoryIndex(newIndex);
				setMaskSnapshot(maskHistory[newIndex]);
				// Also update the actual surface
				if (maskHistory[newIndex] && maskSurfaceRef.current) {
					try {
						isSurfaceOperationInProgressRef.current = true;
						const canvas = maskSurfaceRef.current.getCanvas();
						canvas.clear(Skia.Color('black'));
						canvas.drawImage(maskHistory[newIndex], 0, 0);
						maskSurfaceRef.current.flush();
					} finally {
						isSurfaceOperationInProgressRef.current = false;
					}
				}
				setTimeout(() => {
					isHistoryActionRef.current = false;
				}, 100);
			}
		};

		const handleRedo = () => {
			if (historyIndex < maskHistory.length - 1 && !isSurfaceOperationInProgressRef.current) {
				isHistoryActionRef.current = true;
				const newIndex = historyIndex + 1;
				setHistoryIndex(newIndex);
				setMaskSnapshot(maskHistory[newIndex]);
				// Also update the actual surface
				if (maskHistory[newIndex] && maskSurfaceRef.current) {
					try {
						isSurfaceOperationInProgressRef.current = true;
						const canvas = maskSurfaceRef.current.getCanvas();
						canvas.clear(Skia.Color('black'));
						canvas.drawImage(maskHistory[newIndex], 0, 0);
						maskSurfaceRef.current.flush();
					} finally {
						isSurfaceOperationInProgressRef.current = false;
					}
				}
				setTimeout(() => {
					isHistoryActionRef.current = false;
				}, 100);
			}
		};

		// PanResponder for brush
		const lastImgPointRef = useRef<{ x: number; y: number } | null>(null);

		const panResponder = PanResponder.create({
			onStartShouldSetPanResponder: () => {
				return selectedTool === 'brush' || selectedTool === 'eraser';
			},
			onMoveShouldSetPanResponder: () => {
				return selectedTool === 'brush' || selectedTool === 'eraser';
			},
			onPanResponderGrant: (evt) => {
				console.log(
					'🔥 PanResponder Grant fired',
					selectedTool,
					!!skImage,
					!!maskSurfaceRef.current
				);
				if ((selectedTool !== 'brush' && selectedTool !== 'eraser') || !skImage) return;
				const { locationX, locationY } = evt.nativeEvent;
				const { ix, iy, scale } = mapViewToImage(locationX, locationY);
				const brushPx = brushSize / (scale ?? 1);

				// Track tool usage
				if (selectedTool === 'brush') setHasUsedBrush(true);
				if (selectedTool === 'eraser') setHasUsedEraser(true);

				lastImgPointRef.current = { x: ix, y: iy };
				setIsDrawing(true);

				// Store the current scale for brush size calculation
				currentScaleRef.current = scale ?? 1;

				// Live stroke preview path in view coords
				lastViewPointRef.current = { x: locationX, y: locationY };
				const p = Skia.Path.Make();
				p.moveTo(locationX, locationY);
				setLiveStrokePath(p);

				const isErasing = selectedTool === 'eraser';
				drawStrokeSegmentOnMask({ x: ix, y: iy }, { x: ix, y: iy }, brushPx, isErasing);
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			},
			onPanResponderMove: (evt) => {
				if ((selectedTool !== 'brush' && selectedTool !== 'eraser') || !skImage) return;
				const { locationX, locationY } = evt.nativeEvent;
				const { ix, iy, scale } = mapViewToImage(locationX, locationY);
				const prev = lastImgPointRef.current;
				const prevView = lastViewPointRef.current;
				if (!prev) return;

				// Update live preview path with interpolation for smooth curves
				setLiveStrokePath((old) => {
					if (!old || !prevView) return null;

					const distance = Math.hypot(locationX - prevView.x, locationY - prevView.y);
					const minStepSize = 3; // minimum pixels between interpolated points

					if (distance > minStepSize) {
						// Interpolate between points for smooth curves
						const numSteps = Math.ceil(distance / minStepSize);
						for (let i = 1; i <= numSteps; i++) {
							const t = i / numSteps;
							const x = prevView.x + (locationX - prevView.x) * t;
							const y = prevView.y + (locationY - prevView.y) * t;
							old.lineTo(x, y);
						}
					} else {
						// Small movement, just add the point
						old.lineTo(locationX, locationY);
					}

					lastViewPointRef.current = { x: locationX, y: locationY };
					return old.copy(); // triggers rerender
				});

				// Draw to the offscreen mask surface (fast, no state updates)
				const brushPx = brushSize / (scale ?? 1);
				const isErasing = selectedTool === 'eraser';
				drawStrokeSegmentOnMask(prev, { x: ix, y: iy }, brushPx, isErasing);
				lastImgPointRef.current = { x: ix, y: iy };

				// DON'T update maskSnapshot during drawing - wait until release for smooth performance
			},
			onPanResponderRelease: () => {
				setIsDrawing(false);
				lastImgPointRef.current = null;
				lastViewPointRef.current = null;
				setLiveStrokePath(null);
				// Flush the surface and snapshot after each stroke and save to history
				const surface = maskSurfaceRef.current;
				if (surface && !isSurfaceOperationInProgressRef.current) {
					try {
						isSurfaceOperationInProgressRef.current = true;
						surface.flush();
					} finally {
						isSurfaceOperationInProgressRef.current = false;
					}
				}
				segmentCounterRef.current = 0;
				refreshMaskSnapshot(true);
				setHasMaskContent(true);
			},
			onPanResponderTerminate: () => {
				setIsDrawing(false);
				lastImgPointRef.current = null;
				lastViewPointRef.current = null;
				setLiveStrokePath(null);
				// Flush the surface before snapshot
				const surface = maskSurfaceRef.current;
				if (surface && !isSurfaceOperationInProgressRef.current) {
					try {
						isSurfaceOperationInProgressRef.current = true;
						surface.flush();
					} finally {
						isSurfaceOperationInProgressRef.current = false;
					}
				}
				segmentCounterRef.current = 0;
				refreshMaskSnapshot(true);
				setHasMaskContent(true);
			},
		});

		// Auto-select (magic wand) flood fill on image pixels
		const floodFillRegion = (
			pixels: Uint8Array,
			imgW: number,
			imgH: number,
			sx: number,
			sy: number,
			tol: number
		) => {
			// Returns a Uint8Array (RGBA_8888) where selected pixels are white, others transparent black
			const idx = (x: number, y: number) => (y * imgW + x) * 4;
			const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

			const sxI = clamp(Math.floor(sx), 0, imgW - 1);
			const syI = clamp(Math.floor(sy), 0, imgH - 1);

			const base = idx(sxI, syI);
			const br = pixels[base],
				bg = pixels[base + 1],
				bb = pixels[base + 2];

			const within = (x: number, y: number) => x >= 0 && x < imgW && y >= 0 && y < imgH;

			const visited = new Uint8Array(imgW * imgH);
			const out = new Uint8Array(imgW * imgH * 4); // RGBA

			const qx = new Int32Array(imgW * imgH);
			const qy = new Int32Array(imgW * imgH);
			let qh = 0,
				qt = 0;

			const push = (x: number, y: number) => {
				qx[qt] = x;
				qy[qt] = y;
				qt++;
			};

			const pop = () => {
				const x = qx[qh],
					y = qy[qh];
				qh++;
				return { x, y };
			};

			const colorDist = (r: number, g: number, b: number) => {
				const dr = r - br,
					dg = g - bg,
					db = b - bb;
				// Euclidean distance
				return Math.sqrt(dr * dr + dg * dg + db * db);
			};

			const maxPixels = Math.min(imgW * imgH, 2_000_000); // fail-safe
			let count = 0;

			// Seed
			visited[syI * imgW + sxI] = 1;
			push(sxI, syI);

			while (qh < qt && count < maxPixels) {
				count++;
				const { x, y } = pop();
				const p = idx(x, y);
				const r = pixels[p],
					g = pixels[p + 1],
					b = pixels[p + 2];

				if (colorDist(r, g, b) <= tol) {
					// Select
					out[p] = 255;
					out[p + 1] = 255;
					out[p + 2] = 255;
					out[p + 3] = 255;

					// 4-neighbors (contiguous region)
					const nbs = [
						[x + 1, y],
						[x - 1, y],
						[x, y + 1],
						[x, y - 1],
					];
					for (const [nx, ny] of nbs) {
						if (within(nx, ny)) {
							const vi = ny * imgW + nx;
							if (visited[vi] === 0) {
								visited[vi] = 1;
								push(nx, ny);
							}
						}
					}
				}
			}

			return out;
		};

		const handleAutoSelectTap = async (event: GestureResponderEvent) => {
			if (!skImage || autoSelecting) return;
			setAutoSelecting(true);
			setHasUsedAuto(true); // Track auto-select usage
			try {
				const { locationX, locationY } = event.nativeEvent;
				const { ix, iy } = mapViewToImage(locationX, locationY);

				// Read full image pixels (RGBA_8888)
				const pixels = skImage.readPixels() as unknown as Uint8Array; // RN Skia returns UInt8Array
				const imgW = skImage.width();
				const imgH = skImage.height();
				const regionBytes = floodFillRegion(pixels, imgW, imgH, ix, iy, tolerance);

				// Convert regionBytes -> SkImage and draw onto the mask surface as white
				const data = Skia.Data.fromBytes(regionBytes);
				const regionImg = Skia.Image.MakeImage(
					{
						width: imgW,
						height: imgH,
						alphaType: AlphaType.Unpremul,
						colorType: ColorType.RGBA_8888,
					},
					data,
					imgW * 4
				);

				const surface = maskSurfaceRef.current;
				if (surface && regionImg && !isSurfaceOperationInProgressRef.current) {
					try {
						isSurfaceOperationInProgressRef.current = true;
						const canvas = surface.getCanvas();
						// Draw the white region over black mask (default SrcOver blend mode is fine)
						canvas.drawImage(regionImg, 0, 0);
					} finally {
						isSurfaceOperationInProgressRef.current = false;
					}
					refreshMaskSnapshot();
					setHasMaskContent(true);
				}

				await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			} catch (e) {
				// no-op; keep UX flowing
				console.warn('Auto-select failed:', e);
			} finally {
				setAutoSelecting(false);
			}
		};

		// Clear mask (fill black)
		const handleClearMask = () => {
			const surface = maskSurfaceRef.current;
			if (!surface || !skImage || isSurfaceOperationInProgressRef.current) return;
			const imgW = skImage.width();
			const imgH = skImage.height();
			try {
				isSurfaceOperationInProgressRef.current = true;
				const canvas = surface.getCanvas();
				const paint = Skia.Paint();
				paint.setColor(Skia.Color('black')); // reset = preserve all
				// PaintStyle.Fill = 0
				paint.setStyle(0);
				canvas.drawRect({ x: 0, y: 0, width: imgW, height: imgH }, paint);
			} finally {
				isSurfaceOperationInProgressRef.current = false;
			}
			refreshMaskSnapshot();
			setLiveStrokePath(null);
			setHasMaskContent(false);
		};

		// Export mask as data URI (PNG)
		const handleComplete = async () => {
			const surface = maskSurfaceRef.current;
			if (!surface || isSurfaceOperationInProgressRef.current) return;
			try {
				isSurfaceOperationInProgressRef.current = true;
				surface.flush();
				const image = surface.makeImageSnapshot();
				if (!image) return;
				const b64 = image.encodeToBase64(ImageFormat.PNG, 100);
				const dataUri = `data:image/png;base64,${b64}`;
				onMaskComplete?.(dataUri);
			} finally {
				isSurfaceOperationInProgressRef.current = false;
			}
		};

		// Expose exportMask function via ref
		useImperativeHandle(ref, () => ({
			exportMask: async () => {
				const surface = maskSurfaceRef.current;
				if (!surface || isSurfaceOperationInProgressRef.current) return undefined;
				try {
					isSurfaceOperationInProgressRef.current = true;
					surface.flush();
					const image = surface.makeImageSnapshot();
					if (!image) return undefined;
					const b64 = image.encodeToBase64(ImageFormat.PNG, 100);
					return `data:image/png;base64,${b64}`;
				} finally {
					isSurfaceOperationInProgressRef.current = false;
				}
			},
		}));

		const selectedColorHex = selectedColor?.hex || '#000000';

		return (
			<View className="flex-1 px-6">
				<View className="items-start mb-4">
					<ThemedText
						variant="title-md"
						className="text-gray-900 mb-2 text-center"
						extraBold
					>
						{config.title || 'Select area to replace'}
					</ThemedText>
					<ThemedText variant="body" className="text-gray-600 leading-6">
						{config.description ||
							'Select the area where you want to replace an object'}
					</ThemedText>
				</View>

				{/* Image & Mask Canvas */}
				<View
					className="mb-2.5 relative rounded-2xl overflow-hidden bg-gray-100"
					style={{ height: containerSize.height }}
				>
					{/* Clear button in top right */}
					<TouchableOpacity
						onPress={handleClearMask}
						className="absolute w-10 h-10 flex items-center justify-center top-4  right-4 z-10 bg-gray-900/80 rounded-full p-2"
						style={{ opacity: hasMaskContent ? 1 : 0.3 }}
						disabled={!hasMaskContent}
					>
						<Octicons name="trash" size={20} color="#ffffff" />
					</TouchableOpacity>

					<Canvas ref={useCanvasRef()} style={{ width: '100%', height: '100%' }}>
						{/* Draw the base image to fit inside the square container (contain) */}
						{skImage && (
							<SkiaImage
								image={skImage}
								x={0}
								y={0}
								width={containerSize.width}
								height={containerSize.height}
								fit="contain"
							/>
						)}

						{/* Red overlay where mask is WHITE (use the mask snapshot in luminance mode) */}
						{maskSnapshot && (
							<SkiaMask
								mode="luminance"
								clip={false}
								mask={
									<SkiaImage
										image={maskSnapshot}
										x={0}
										y={0}
										width={containerSize.width}
										height={containerSize.height}
										fit="contain"
									/>
								}
							>
								<Rect
									x={0}
									y={0}
									width={containerSize.width}
									height={containerSize.height}
									color="rgba(255,0,0,0.6)"
								/>
							</SkiaMask>
						)}

						{/* Live stroke preview during drawing (optimized, no re-renders of full mask) */}
						{liveStrokePath &&
							(selectedTool === 'brush' || selectedTool === 'eraser') && (
								<SkiaPathComponent
									path={liveStrokePath}
									color={
										selectedTool === 'eraser'
											? 'rgba(0, 0, 0, 0.5)'
											: 'rgba(255, 0, 0, 0.6)'
									}
									style="stroke"
									strokeWidth={brushSize}
									strokeCap="round"
								/>
							)}

						{/* Size preview circle when dragging slider */}
						{(selectedTool === 'brush' || selectedTool === 'eraser') &&
							isDraggingSlider &&
							(() => {
								// Create a nice looking preview with both fill and stroke
								const centerX = containerSize.width / 2;
								const centerY = containerSize.height / 2;
								const radius = brushSize / 2;

								// Inner circle path with stroke
								const strokePath = Skia.Path.Make();
								strokePath.addCircle(centerX, centerY, radius);

								// Outer circle path for background glow effect
								const glowPath = Skia.Path.Make();
								glowPath.addCircle(centerX, centerY, radius + 8);

								const mainColor =
									selectedTool === 'eraser'
										? 'rgba(0, 0, 0, 0.4)'
										: 'rgba(0, 0, 0, 0.4)';
								const strokeColor =
									selectedTool === 'eraser'
										? 'rgba(0, 0, 0, 0.8)'
										: 'rgba(0, 0, 0, 0.8)';

								return (
									<Group opacity={sliderOpacity}>
										{/* Glow background */}
										<SkiaPathComponent
											path={glowPath}
											color="rgba(0, 0, 0, 0.1)"
											style="fill"
										/>
										{/* Main circle fill */}
										<SkiaPathComponent
											path={strokePath}
											color={mainColor}
											style="fill"
										/>
										{/* Stroke outline */}
										<SkiaPathComponent
											path={strokePath}
											color={strokeColor}
											style="stroke"
											strokeWidth={2}
										/>
									</Group>
								);
							})()}
					</Canvas>

					{/* Gesture layers */}
					{selectedTool === 'auto' ? (
						<TouchableOpacity
							className="absolute inset-0"
							activeOpacity={1}
							onPress={handleAutoSelectTap}
						/>
					) : (
						<View className="absolute inset-0" {...panResponder.panHandlers} />
					)}

					{/* Instructions Overlay - show until tool is used */}
					{skImage !== null &&
						((selectedTool === 'auto' && !hasUsedAuto && !autoSelecting) ||
							(selectedTool === 'brush' && !hasUsedBrush && !isDrawing) ||
							(selectedTool === 'eraser' && !hasUsedEraser && !isDrawing)) && (
							<View
								pointerEvents="none"
								className="absolute flex items-center justify-center inset-0 "
							>
								<View className="bg-black/60 rounded-xl px-4 py-3 max-w-xs">
									<ThemedText variant="body" className="text-white text-center">
										{selectedTool === 'auto'
											? 'Tap to auto-select similar area'
											: selectedTool === 'brush'
												? 'Drag to mark the area to edit'
												: 'Drag to erase the area'}
									</ThemedText>
								</View>
							</View>
						)}
				</View>

				<ScrollView>
					{/* Tool Selection Below Image - Small Icon Buttons */}
					<View className="flex-row gap-3 items-center mb-6">
						<View className="flex-row border-r pr-3 border-gray-300">
							<TouchableOpacity
								onPress={() => setSelectedTool('brush')}
								className={`w-12 h-12 rounded-full  items-center justify-center ${
									selectedTool === 'brush'
										? 'bg-gray-900 text-gray-50'
										: 'text-gray-900 bg-transparent border-0'
								}`}
							>
								<Octicons
									name="pencil"
									size={22}
									color={selectedTool === 'brush' ? '#f9fafb' : '#9CA3AF'}
								/>
							</TouchableOpacity>
						</View>
						<TouchableOpacity
							onPress={() => setSelectedTool('auto')}
							className={`w-12 h-12 rounded-full items-center justify-center ${
								selectedTool === 'auto'
									? 'bg-gray-900 text-gray-50'
									: 'text-gray-900 bg-transparent border-0'
							}`}
						>
							<Octicons
								name="paintbrush"
								size={22}
								color={selectedTool === 'auto' ? '#f9fafb' : '#9CA3AF'}
							/>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={() => setSelectedTool('eraser')}
							className={`w-12 h-12 rounded-full items-center justify-center ${
								selectedTool === 'eraser'
									? 'bg-gray-900 text-gray-50'
									: 'text-gray-900 bg-transparent border-0'
							}`}
						>
							<FontAwesome6
								name="eraser"
								size={22}
								color={selectedTool === 'eraser' ? '#f9fafb' : '#9CA3AF'}
							/>
						</TouchableOpacity>

						{/* Undo/Redo buttons */}
						<View className="flex-row ml-auto">
							<TouchableOpacity
								onPress={handleUndo}
								disabled={historyIndex <= 0}
								className={`w-12 h-12 rounded-full items-center justify-center ${
									historyIndex <= 0 ? 'opacity-30' : 'opacity-100'
								}`}
							>
								<FontAwesome5
									name="undo"
									size={22}
									color={historyIndex <= 0 ? '#9CA3AF' : '#111827'}
								/>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleRedo}
								disabled={historyIndex >= maskHistory.length - 1}
								className={`w-12 h-12 rounded-full items-center justify-center ${
									historyIndex >= maskHistory.length - 1
										? 'opacity-30'
										: 'opacity-100'
								}`}
							>
								<FontAwesome5
									name="redo"
									size={22}
									color={
										historyIndex >= maskHistory.length - 1
											? '#9CA3AF'
											: '#111827'
									}
								/>
							</TouchableOpacity>
						</View>
					</View>

					{/* Unified Slider for All Tools */}
					<View className="mb-4 bg-gray-50 rounded-xl">
						<ThemedText variant="body" className="text-gray-700 mb-3">
							{selectedTool === 'brush' && `Brush Size: ${brushSize}px`}
							{selectedTool === 'auto' && `Tolerance: ${tolerance}`}
							{selectedTool === 'eraser' && `Eraser Size: ${brushSize}px`}
						</ThemedText>
						<Slider
							minimumValue={selectedTool === 'auto' ? 15 : 10}
							maximumValue={selectedTool === 'auto' ? 45 : 100}
							step={selectedTool === 'auto' ? 1 : 5}
							value={selectedTool === 'auto' ? tolerance : brushSize}
							onValueChange={(value: number) => {
								if (selectedTool === 'auto') {
									setTolerance(value);
								} else {
									setBrushSize(value);
								}
							}}
							onSlidingStart={() => {
								// Clear any existing fade interval
								if (fadeIntervalRef.current) {
									clearInterval(fadeIntervalRef.current);
								}
								setIsDraggingSlider(true);
								// Fade in
								let opacity = 0;
								const interval = setInterval(() => {
									opacity += 0.1;
									setSliderOpacity(opacity);
									if (opacity >= 1) {
										clearInterval(interval);
										fadeIntervalRef.current = null;
									}
								}, 16); // ~60fps
								fadeIntervalRef.current = interval;
							}}
							onSlidingComplete={() => {
								// Clear any existing fade interval
								if (fadeIntervalRef.current) {
									clearInterval(fadeIntervalRef.current);
								}
								// Fade out - keep isDraggingSlider true during fade
								let opacity = 1;
								const interval = setInterval(() => {
									opacity -= 0.05;
									setSliderOpacity(Math.max(0, opacity));
									if (opacity <= 0) {
										clearInterval(interval);
										fadeIntervalRef.current = null;
										// Only set isDraggingSlider to false after fade completes
										setIsDraggingSlider(false);
									}
								}, 16); // ~60fps
								fadeIntervalRef.current = interval;
							}}
							minimumTrackTintColor="#111827"
							maximumTrackTintColor="#D1D5DB"
							thumbTintColor="#111827"
						/>
					</View>
				</ScrollView>
			</View>
		);
	}
);

MaskStep.displayName = 'MaskStep';
