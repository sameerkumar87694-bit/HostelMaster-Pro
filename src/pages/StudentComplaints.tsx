import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { Student, Complaint } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, where } from 'firebase/firestore';
import { MessageSquare, Plus, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentComplaints() {
  const { user } = useAuth();
  const { data: students } = useCollection<Student>('students', [where('userId', '==', user?.uid || '')]);
  const student = students?.[0];
  
  const { data: complaints } = useCollection<Complaint>('complaints', [where('studentId', '==', student?.id || '')]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    const formData = new FormData(e.target as HTMLFormElement);
    try {
      await addDoc(collection(db, 'complaints'), {
        studentId: student.id,
        description: formData.get('description'),
        status: 'pending',
        submittedDate: new Date().toISOString(),
        resolvedDate: null
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'in-progress': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'resolved': return 'bg-green-50 text-green-600 border-green-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Complaints</h1>
          <p className="text-xs text-slate-500">View status or register a new issue.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Complaint
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {complaints?.sort((a,b) => b.submittedDate.localeCompare(a.submittedDate)).map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center hover:border-blue-200 transition-colors">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900 truncate pr-4">{item.description}</h3>
              <p className="text-[10px] text-slate-400 font-medium">Submitted on {new Date(item.submittedDate).toLocaleDateString()}</p>
            </div>
            <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(item.status)}`}>
              {item.status}
            </div>
          </div>
        ))}
        {(!complaints || complaints.length === 0) && (
          <div className="p-12 text-center text-slate-400 text-xs italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-50" />
            You haven't registered any complaints.
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
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">New Complaint</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                  <textarea 
                    name="description" 
                    rows={4} 
                    required 
                    placeholder="Describe your issue in detail..." 
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
                    Submit Report
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
