import React from 'react';
import { useCollection } from '../hooks/useCollection';
import { Complaint, Student } from '../types';
import { db } from '../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { MessageSquare, AlertCircle, Clock, CheckCircle2, User, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminComplaints() {
  const { data: complaints } = useCollection<Complaint>('complaints');
  const { data: students } = useCollection<Student>('students');

  const updateStatus = async (id: string, status: Complaint['status']) => {
    try {
      await updateDoc(doc(db, 'complaints', id), {
        status,
        resolvedDate: status === 'resolved' ? new Date().toISOString() : null
      });
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
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Complaints Queue</h1>
        <p className="text-xs text-slate-500">Monitor and resolve student issues.</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {complaints?.sort((a, b) => b.submittedDate.localeCompare(a.submittedDate)).map((complaint) => {
          const student = students?.find(s => s.id === complaint.studentId);
          return (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 hover:border-blue-200 transition-colors"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(complaint.status)}`}>
                    {complaint.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">#{complaint.id.slice(0, 8)}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 truncate pr-4">{complaint.description}</h3>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium pt-1">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {student?.name || 'Anonymous'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(complaint.submittedDate).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                {complaint.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(complaint.id, 'in-progress')}
                    className="flex-1 md:flex-none px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-100 transition-all"
                  >
                    Investigate
                  </button>
                )}
                {complaint.status !== 'resolved' && (
                  <button
                    onClick={() => updateStatus(complaint.id, 'resolved')}
                    className="flex-1 md:flex-none px-3 py-1.5 bg-green-50 text-green-600 border border-green-100 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-green-100 transition-all"
                  >
                    Resolve
                  </button>
                )}
                {complaint.status === 'resolved' && (
                  <div className="bg-green-50 text-green-600 p-2 rounded-lg border border-green-100">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {(!complaints || complaints.length === 0) && (
          <div className="p-12 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-slate-400 italic">No complaints shared yet. Everything seems quiet!</p>
          </div>
        )}
      </div>
    </div>
  );
}
