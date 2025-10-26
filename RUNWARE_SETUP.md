# Runware AI Integration Setup

## Overview

This app integrates with Runware AI using the REST API to generate interior design images based on user selections (room type, style, and color palette).

We're using the REST API directly (not the SDK) because the official JavaScript SDK requires Node.js-specific modules that aren't available in React Native.

## Setup Instructions

### 1. Get a Runware API Key

1. Sign up at [Runware](https://runware.ai)
2. Navigate to your account settings or API section
3. Generate a new API key
4. Copy the API key

### 2. Configure the API Key

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_RUNWARE_API_KEY=your_actual_api_key_here
```

**Important**: Make sure `.env` is in your `.gitignore` to avoid committing secrets!

### 3. Restart Development Server

After creating or modifying the `.env` file, restart your development server:

```bash
npm start
```

## How It Works

### User Flow

1. User selects a photo from their gallery
2. User chooses a room type (e.g., "Living Room", "Bedroom")
3. User selects a style (e.g., "Modern", "Scandinavian")
4. User picks a color palette
5. On step 5 (Generating), the app:
    - Makes a REST API call to Runware with the user's selections
    - Builds a prompt from the room, style, and palette
    - Displays a loading animation while generating
    - Shows the generated image when complete
    - Automatically returns to the main screen after 2 seconds

### Prompt Building

The app builds prompts like:

```
"a living room in modern style with Ocean Breeze color scheme, modern interior design, professional photography, high quality, detailed"
```

## API Request Format

The integration uses Runware's REST API with this request format (as documented at https://runware.ai/docs/en/getting-started/how-to-connect):

```json
[
	{
		"taskType": "imageInference",
		"taskUUID": "unique-uuid-v4",
		"positivePrompt": "your prompt here",
		"negativePrompt": "low quality, blurry, distorted, bad anatomy, poorly drawn",
		"width": 1024,
		"height": 1024,
		"model": "runware:101@1",
		"numberResults": 1,
		"seedImage": "optional-image-uri"
	}
]
```

The API endpoint is: `https://api.runware.ai/v1`

The API returns responses in this format:

```json
{
	"data": [
		{
			"taskType": "imageInference",
			"imageUUID": "unique-image-uuid",
			"taskUUID": "your-task-uuid",
			"seed": 123456789,
			"imageURL": "https://im.runware.ai/image/.../image.jpg"
		}
	]
}
```

## Testing

1. Make sure you have a valid API key set in your `.env` file
2. Restart your development server
3. Navigate through the generate flow:
    - Select a photo
    - Choose a room
    - Select a style
    - Pick a color palette
    - Tap "Generate"
4. Watch the console logs for debugging information
5. The generated image should appear in the loading screen

## Troubleshooting

### "API key not configured" Error

- Ensure your `.env` file exists in the project root
- Verify the key is named `EXPO_PUBLIC_RUNWARE_API_KEY`
- Restart your development server after creating/modifying `.env`

### "Network request failed" Error

This error typically indicates one of the following:

1. **Invalid API Endpoint**: Verify the API endpoint is correct (should be `https://api.runware.com/v1/imageInference`)
2. **Network/CORS Issues**: If testing on web, the API might have CORS restrictions. Try testing on a physical device or simulator.
3. **API Key Issues**: Double-check your API key is valid and has the correct permissions.
4. **Mobile-Specific Issues**: On iOS, check your Info.plist has the necessary network permissions. On Android, ensure the app has INTERNET permission.

Try these steps:

- Restart your development server
- Test on a physical device instead of simulator/web
- Check the console logs for the exact error message
- Verify your API key is active in the Runware dashboard

### "No image URL in response" Error

If you see this error:

- Check the console logs for the actual API response
- Verify your API key has sufficient credits
- Try a simpler prompt first

## Image-to-Image Support

The integration supports seed images for image-to-image generation. When a user selects a photo in step 1, it's used as a `seedImage` parameter in the API request.

## Custom Models

You can change the model by modifying this line in `components/useRunwareAI.ts`:

```typescript
model: 'runware:101@1', // FLUX model
```

Available models can be found in the [Runware Model Explorer](https://runware.ai/models).

## Cost Considerations

- Each image generation typically costs credits
- Monitor your API usage in the Runware dashboard
- Consider implementing rate limiting for production
- You may want to restrict generation to pro users only

## Security Notes

**Important**: Never commit your `.env` file to version control!

The API key is:

- Read from environment variables
- Never exposed in client-side code (Expo handles this)
- Protected by the `EXPO_PUBLIC_` prefix system

## Documentation

For more information:

- [Runware Image Inference API](https://runware.ai/docs/en/image-inference/text-to-image)
- [Runware Image-to-Image Guide](https://runware.ai/docs/en/image-inference/image-to-image)
- [Runware Model Explorer](https://runware.ai/models)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the console logs for detailed error messages
3. Verify your API key is active in the Runware dashboard
4. Check the Runware documentation for API updates
