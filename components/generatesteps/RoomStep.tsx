import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '../ThemedText';
import { CustomButton } from '../CustomButton';
import { StepConfig } from '../../config/stepConfig';

interface Room {
	id: string;
	name: string;
	icon: string;
	iconType?: 'octicons' | 'material' | 'material-community' | 'ionicons';
	description: string;
	isCustom?: boolean;
}

interface RoomStepProps {
	onRoomSelect?: (room: Room | null) => void;
	config: StepConfig;
	selectedRoom?: Room | null;
}

const roomTypes: Room[] = [
	{
		id: 'living-room',
		name: 'Living Room',
		icon: 'home',
		description: 'Main gathering space for relaxation and entertainment',
	},
	{
		id: 'bedroom',
		name: 'Bedroom',
		icon: 'bed',
		iconType: 'material',
		description: 'Personal space for rest and relaxation',
	},
	{
		id: 'kitchen',
		name: 'Kitchen',
		icon: 'kitchen',
		iconType: 'material',
		description: 'Cooking and dining area',
	},
	{
		id: 'bathroom',
		name: 'Bathroom',
		icon: 'shower',
		iconType: 'material-community',
		description: 'Personal hygiene and grooming space',
	},
	{
		id: 'dining-room',
		name: 'Dining Room',
		icon: 'table',
		description: 'Formal dining and meal space',
	},
	{
		id: 'office',
		name: 'Home Office',
		icon: 'briefcase',
		description: 'Work and productivity space',
	},
	{
		id: 'nursery',
		name: 'Nursery',
		icon: 'heart',
		description: 'Baby and child room',
	},
	{
		id: 'basement',
		name: 'Basement',
		icon: 'arrow-down',
		description: 'Lower level storage and utility space',
	},
	{
		id: 'attic',
		name: 'Attic',
		icon: 'home-roof',
		iconType: 'material-community',
		description: 'Upper storage and additional space',
	},
	{
		id: 'garage',
		name: 'Garage',
		icon: 'car-outline',
		iconType: 'ionicons',
		description: 'Vehicle storage and workshop space',
	},
];

export function RoomStep({ onRoomSelect, config, selectedRoom }: RoomStepProps) {
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(selectedRoom?.id || null);
	const [customRooms, setCustomRooms] = useState<Room[]>([]);
	const [showAddModal, setShowAddModal] = useState<boolean>(false);
	const [newRoomName, setNewRoomName] = useState<string>('');
	const [showEditModal, setShowEditModal] = useState<boolean>(false);
	const [editingRoom, setEditingRoom] = useState<Room | null>(null);
	const [editRoomName, setEditRoomName] = useState<string>('');
	const [allRooms, setAllRooms] = useState<Room[]>(roomTypes);

	// Load custom rooms from AsyncStorage on component mount
	useEffect(() => {
		loadCustomRooms();
	}, []);

	// Update allRooms when customRooms change - custom rooms first
	useEffect(() => {
		setAllRooms([...customRooms, ...roomTypes]);
	}, [customRooms]);

	const loadCustomRooms = async () => {
		try {
			const stored = await AsyncStorage.getItem('customRooms');
			if (stored) {
				const rooms = JSON.parse(stored);
				setCustomRooms(rooms);
			}
		} catch (error) {
			console.error('Error loading custom rooms:', error);
		}
	};

	const saveCustomRooms = async (rooms: Room[]) => {
		try {
			await AsyncStorage.setItem('customRooms', JSON.stringify(rooms));
		} catch (error) {
			console.error('Error saving custom rooms:', error);
		}
	};

	const handleRoomSelect = (room: Room) => {
		setSelectedRoomId(room.id);
		onRoomSelect?.(room);
	};

	const handleAddRoom = () => {
		if (newRoomName.trim()) {
			const newRoom: Room = {
				id: `custom-${Date.now()}`,
				name: newRoomName.trim(),
				icon: 'three-dots',
				iconType: 'octicons',
				description: 'Custom room type',
				isCustom: true,
			};

			const updatedCustomRooms = [...customRooms, newRoom];
			setCustomRooms(updatedCustomRooms);
			saveCustomRooms(updatedCustomRooms);

			// Auto-select the newly added room
			setSelectedRoomId(newRoom.id);
			onRoomSelect?.(newRoom);

			setNewRoomName('');
			setShowAddModal(false);
		}
	};

	const handleCancelAdd = () => {
		setNewRoomName('');
		setShowAddModal(false);
	};

	const handleLongPress = (room: Room) => {
		if (room.isCustom) {
			setEditingRoom(room);
			setEditRoomName(room.name);
			setShowEditModal(true);
		}
	};

	const handleEditRoom = () => {
		if (editingRoom && editRoomName.trim()) {
			const updatedCustomRooms = customRooms.map((room) =>
				room.id === editingRoom.id ? { ...room, name: editRoomName.trim() } : room
			);
			setCustomRooms(updatedCustomRooms);
			saveCustomRooms(updatedCustomRooms);

			// Update selected room if it was the one being edited
			if (selectedRoomId === editingRoom.id) {
				const updatedRoom = { ...editingRoom, name: editRoomName.trim() };
				onRoomSelect?.(updatedRoom);
			}

			setEditRoomName('');
			setEditingRoom(null);
			setShowEditModal(false);
		}
	};

	const handleDeleteRoom = () => {
		if (editingRoom) {
			const updatedCustomRooms = customRooms.filter((room) => room.id !== editingRoom.id);
			setCustomRooms(updatedCustomRooms);
			saveCustomRooms(updatedCustomRooms);

			// Clear selection if the deleted room was selected
			if (selectedRoomId === editingRoom.id) {
				setSelectedRoomId(null);
				onRoomSelect?.(null);
			}

			setEditRoomName('');
			setEditingRoom(null);
			setShowEditModal(false);
		}
	};

	const handleCancelEdit = () => {
		setEditRoomName('');
		setEditingRoom(null);
		setShowEditModal(false);
	};

	return (
		<View className="flex-1 px-6">
			<View className="items-start mb-6">
				<ThemedText variant="title-md" className="text-gray-900 mb-2 text-center" extraBold>
					{config.title}
				</ThemedText>

				<ThemedText variant="body" className="text-gray-600 leading-6">
					{config.subtitle}
				</ThemedText>
			</View>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 20 }}
			>
				<View className="flex-row flex-wrap justify-between gap-3">
					{/* Add Room Type Button */}
					<TouchableOpacity
						onPress={() => {
							setShowAddModal(true);
							setEditingRoom(null);
							setNewRoomName('');
							setEditRoomName('');
						}}
						className="w-[48%] p-4 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50"
						activeOpacity={0.7}
					>
						<View className="items-center">
							<View className="w-12 h-12 rounded-full items-center justify-center mb-3 bg-gray-100">
								<Octicons name="plus" size={24} color="#6B7280" />
							</View>
							<ThemedText
								variant="body"
								className="font-semibold text-center text-gray-600"
							>
								Add Room Type
							</ThemedText>
						</View>
					</TouchableOpacity>
					{allRooms.map((room) => {
						const isSelected = selectedRoomId === room.id;

						const isCustomRoom = room.isCustom;

						return (
							<TouchableOpacity
								key={room.id}
								onPress={() => handleRoomSelect(room)}
								onLongPress={() => handleLongPress(room)}
								className={`w-[48%] p-4 rounded-2xl border-2 ${
									isSelected
										? 'bg-blue-50 border-blue-500'
										: 'bg-gray-50 border-gray-200'
								}`}
								activeOpacity={0.7}
							>
								<View className="items-center">
									{isCustomRoom ? (
										<View className="w-12 h-12 rounded-full items-center justify-center mb-3 bg-gray-100">
											<Octicons name="home" size={24} color="#6B7280" />
										</View>
									) : (
										<View
											className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${
												isSelected ? 'bg-blue-100' : 'bg-gray-100'
											}`}
										>
											<>
												{room.iconType === 'material' ? (
													<MaterialIcons
														name={room.icon as any}
														size={24}
														color={isSelected ? '#3B82F6' : '#6B7280'}
													/>
												) : room.iconType === 'material-community' ? (
													<MaterialCommunityIcons
														name={room.icon as any}
														size={24}
														color={isSelected ? '#3B82F6' : '#6B7280'}
													/>
												) : room.iconType === 'ionicons' ? (
													<Ionicons
														name={room.icon as any}
														size={24}
														color={isSelected ? '#3B82F6' : '#6B7280'}
													/>
												) : (
													<Octicons
														name={room.icon as any}
														size={24}
														color={isSelected ? '#3B82F6' : '#6B7280'}
													/>
												)}
											</>
										</View>
									)}

									<ThemedText
										variant="body"
										className={`font-semibold text-center mb-1 ${
											isSelected ? 'text-blue-900' : 'text-gray-900'
										}`}
									>
										{room.name}
									</ThemedText>
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			</ScrollView>

			{/* Add Room Modal */}
			<Modal
				visible={showAddModal}
				transparent={true}
				animationType="fade"
				onRequestClose={handleCancelAdd}
			>
				<View className="flex-1 bg-black/50 justify-center items-center px-6">
					<TouchableOpacity
						className="absolute inset-0"
						activeOpacity={1}
						onPress={handleCancelAdd}
					/>
					<View className="bg-white rounded-2xl p-4 w-full relative">
						<TouchableOpacity
							onPress={handleCancelAdd}
							className="absolute top-4 right-4 z-10"
							activeOpacity={0.7}
						>
							<Octicons name="x" size={20} color="#6B7280" />
						</TouchableOpacity>
						<ThemedText variant="title-md" className="text-gray-900" extraBold>
							Add New Room Type
						</ThemedText>
						<ThemedText variant="body" className="text-gray-600 mb-3">
							Enter the name of the room type you want to add
						</ThemedText>

						<TextInput
							value={newRoomName}
							onChangeText={setNewRoomName}
							placeholder="e.g., Study Room, Game Room, etc."
							className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-4 text-gray-900"
							placeholderTextColor="#9CA3AF"
							autoFocus
						/>

						<View className="flex-row gap-2 mb-8">
							<CustomButton
								title="Cancel"
								onPress={handleCancelAdd}
								variant="ghost"
								size="sm"
								className="flex-1"
							/>
							<CustomButton
								title="Add"
								onPress={handleAddRoom}
								variant="primary"
								size="sm"
								className="flex-1"
								disabled={!newRoomName.trim()}
							/>
						</View>
					</View>
				</View>
			</Modal>

			{/* Edit Room Modal */}
			<Modal
				visible={showEditModal}
				transparent={true}
				animationType="fade"
				onRequestClose={handleCancelEdit}
			>
				<View className="flex-1 bg-black/50 justify-center items-center px-6">
					<TouchableOpacity
						className="absolute inset-0"
						activeOpacity={1}
						onPress={handleCancelEdit}
					/>
					<View className="bg-white rounded-2xl p-4 w-full relative">
						<TouchableOpacity
							onPress={handleCancelEdit}
							className="absolute top-4 right-4 z-10"
							activeOpacity={0.7}
						>
							<Octicons name="x" size={20} color="#6B7280" />
						</TouchableOpacity>
						<ThemedText variant="title-md" className="text-gray-900" extraBold>
							Edit Room Type
						</ThemedText>
						<ThemedText variant="body" className="text-gray-600 mb-3">
							Update the name of this room type
						</ThemedText>

						<TextInput
							value={editRoomName}
							onChangeText={setEditRoomName}
							placeholder="Enter room name"
							className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-4 text-gray-900"
							placeholderTextColor="#9CA3AF"
							autoFocus
						/>

						<View className="flex-row gap-2 mb-8">
							<CustomButton
								title="Delete"
								onPress={handleDeleteRoom}
								variant="ghost"
								size="sm"
								className="flex-1"
							/>
							<CustomButton
								title="Save"
								onPress={handleEditRoom}
								variant="primary"
								size="sm"
								className="flex-1"
								disabled={!editRoomName.trim()}
							/>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}
