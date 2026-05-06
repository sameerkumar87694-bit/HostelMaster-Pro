import React, { useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import { Visitor, Student } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Plus, History, User, LogIn, LogOut, Search, Clock, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminVisitors() {
  const { data: visitors } = useCollection<Visitor>('visitors');
  const { data: students } = useCollection<Student>('students');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const visitorData = {
      studentId: formData.get('studentId') as string,
      visitorName: formData.get('visitorName') as string,
      purpose: formData.get('purpose') as string,
      visitDate: new Date().toISOString().split('T')[0],
      checkIn: new Date().toISOString(),
      checkOut: null,
    };

    try {
      await addDoc(collection(db, 'visitors'), visitorData);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await updateDoc(doc(db, 'visitors', id), {
        checkOut: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Visitor Records</h1>
          <p className="text-xs text-slate-500">Track entries and exits of non-residents.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Log New Visitor
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visitor</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visiting Student</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Purpose</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Timing</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visitors?.sort((a,b) => b.checkIn.localeCompare(a.checkIn)).map((visitor) => {
                const student = students?.find(s => s.id === visitor.studentId);
                return (
                  <tr key={visitor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">{visitor.visitorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                       <span className="text-xs font-medium text-slate-600 border-b border-slate-100">{student?.name || 'Unknown'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs truncate max-w-[150px]">{visitor.purpose}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase">
                          <LogIn className="w-3 h-3" />
                          {new Date(visitor.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {visitor.checkOut ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase">
                            <LogOut className="w-3 h-3" />
                            {new Date(visitor.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase animate-pulse">
                            <Clock className="w-3 h-3" />
                            Active
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!visitor.checkOut ? (
                        <button
                          onClick={() => handleCheckOut(visitor.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95 uppercase tracking-tighter"
                        >
                          Check Out
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                          Out
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!visitors || visitors.length === 0) && (
            <div className="p-8 text-center text-slate-400 text-xs italic">No visitor logs found.</div>
          )}
        </div>
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
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Log Visitor Entry</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleCreateVisitor} className="p-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visitor Full Name</label>
                  <input 
                    name="visitorName" 
                    required 
                    placeholder="John Smith" 
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Student</label>
                  <select 
                    name="studentId" 
                    required 
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  >
                    <option value="">-- Select Student --</option>
                    {students?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Purpose of Visit</label>
                  <textarea 
                    name="purpose" 
                    rows={2} 
                    required 
                    placeholder="Reason for entry..." 
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-all" 
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
                    Log Entry
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
