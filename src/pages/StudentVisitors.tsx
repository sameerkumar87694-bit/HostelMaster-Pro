import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { Student, Visitor } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, where } from 'firebase/firestore';
import { User, Plus, LogIn, LogOut, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentVisitors() {
  const { user } = useAuth();
  const { data: students } = useCollection<Student>('students', [where('userId', '==', user?.uid || '')]);
  const student = students?.[0];
  
  const { data: visitors } = useCollection<Visitor>('visitors', [where('studentId', '==', student?.id || '')]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    const formData = new FormData(e.target as HTMLFormElement);
    try {
      await addDoc(collection(db, 'visitors'), {
        studentId: student.id,
        visitorName: formData.get('visitorName'),
        purpose: formData.get('purpose'),
        visitDate: new Date().toISOString().split('T')[0],
        checkIn: new Date().toISOString(),
        checkOut: null
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Visitors</h1>
          <p className="text-xs text-slate-500">Log new visits and view past visitors.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Pre-Log Visitor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {visitors?.sort((a,b) => b.checkIn.localeCompare(a.checkIn)).map((item) => (
          <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 hover:border-blue-200 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-slate-400 border border-gray-100">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-slate-900 truncate">{item.visitorName}</h3>
              <p className="text-[10px] text-slate-500 line-clamp-1 font-medium">{item.purpose}</p>
            </div>
            <div className="text-right flex flex-col gap-0.5 min-w-[60px]">
              <div className="text-[9px] font-bold text-green-600 flex items-center justify-end gap-1 uppercase tracking-tight">
                <LogIn className="w-3 h-3" />
                {new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {item.checkOut ? (
                <div className="text-[9px] font-bold text-blue-600 flex items-center justify-end gap-1 uppercase tracking-tight">
                  <LogOut className="w-3 h-3" />
                  {new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              ) : (
                <div className="text-[9px] font-bold text-slate-400 flex items-center justify-end gap-1 uppercase tracking-tight animate-pulse">
                  <Clock className="w-3 h-3" />
                  Active
                </div>
              )}
            </div>
          </div>
        ))}
        {(!visitors || visitors.length === 0) && (
          <div className="p-12 text-center text-slate-300 text-xs italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200 col-span-full">
            No visitor logs recorded.
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 overflow-hidden border border-gray-200"
            >
              <div className="px-4 py-3 bg-slate-900 flex justify-between items-center border-b border-gray-100">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Pre-Log Visitor</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visitor Name</label>
                  <input 
                    name="visitorName" 
                    required 
                    placeholder="Guest Name" 
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Purpose</label>
                  <input 
                    name="purpose" 
                    required 
                    placeholder="e.g. Study, Delivery" 
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                  />
                </div>
                <div className="pt-2 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 py-2 text-[10px] font-bold text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-lg uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-100 uppercase tracking-wider transition-colors"
                  >
                    Log Check-In
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
