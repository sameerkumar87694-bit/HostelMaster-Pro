import React, { useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import { Room } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, X, PlusCircle, MinusCircle, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminRooms() {
  const { data: rooms, loading } = useCollection<Room>('rooms');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Partial<Room> | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newCapacity = Number(formData.get('capacity'));
    const occupiedCount = currentRoom?.occupiedCount || 0;

    if (newCapacity < occupiedCount) {
      alert(`Cannot reduce capacity below current occupancy of ${occupiedCount} students.`);
      return;
    }

    const roomData: any = {
      roomNumber: formData.get('roomNumber') as string,
      type: formData.get('type') as string,
      capacity: newCapacity,
      status: formData.get('status') as any,
    };

    // Auto-adjust status based on occupancy and capacity
    // 1. If reached capacity, set to 'full' (unless maintenance)
    if (occupiedCount >= newCapacity && roomData.status !== 'maintenance') {
      roomData.status = 'full';
    }
    // 2. If dropped below capacity and was 'full', reset to 'available'
    if (occupiedCount < newCapacity && roomData.status === 'full') {
      roomData.status = 'available';
    }

    try {
      if (currentRoom?.id) {
        await updateDoc(doc(db, 'rooms', currentRoom.id), roomData);
      } else {
        roomData.occupiedCount = 0;
        await addDoc(collection(db, 'rooms'), roomData);
      }
      setIsModalOpen(false);
      setCurrentRoom(null);
    } catch (err) {
      console.error("Error saving room:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      await deleteDoc(doc(db, 'rooms', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">Room Inventory</h1>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total capacity: {rooms?.reduce((acc, r) => acc + r.capacity, 0) || 0} students</p>
        </div>
        <button
          onClick={() => {
            setCurrentRoom({});
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Room
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rooms?.map((room) => (
          <motion.div
            key={room.id}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Room {room.roomNumber}</h3>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">{room.type}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setCurrentRoom(room);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-md transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleDelete(room.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-xs font-bold text-gray-800">
                  {room.occupiedCount} out of {room.capacity} beds occupied
                </p>
              </div>
              <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                room.status === 'available' ? 'bg-green-50 text-green-600' :
                room.status === 'full' ? 'bg-blue-50 text-blue-600' :
                'bg-orange-50 text-orange-600'
              }`}>
                {room.status}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 overflow-hidden border border-gray-200"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">
                  {currentRoom?.id ? 'Modify Room Info' : 'Initialize New Room'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Room Identifier</label>
                    <input 
                      name="roomNumber"
                      defaultValue={currentRoom?.roomNumber}
                      required
                      placeholder="e.g. 101"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Classification</label>
                    <select 
                      name="type"
                      defaultValue={currentRoom?.type || 'Standard'}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all appearance-none"
                    >
                      <option>Standard</option>
                      <option>Deluxe</option>
                      <option>Premium</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Max Capacity</label>
                    <input 
                      type="number"
                      name="capacity"
                      defaultValue={currentRoom?.capacity || 2}
                      min={currentRoom?.occupiedCount || 1}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Operational Status</label>
                    <select 
                      name="status"
                      defaultValue={currentRoom?.status || 'available'}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all appearance-none"
                    >
                      <option value="available">Available</option>
                      <option value="full">Full</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2 text-[11px] font-bold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors uppercase tracking-wider"
                  >
                    Dismiss
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 text-[11px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all uppercase tracking-wider"
                  >
                    Confirm Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
