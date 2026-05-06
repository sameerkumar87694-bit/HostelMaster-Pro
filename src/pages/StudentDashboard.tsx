import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { Student, Room, Complaint, Fee } from '../types';
import { where } from 'firebase/firestore';
import { Bed, MessageSquare, CreditCard, History, AlertCircle, CheckCircle2, Home, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  
  // Fetch the current student record
  const { data: students } = useCollection<Student>('students', [where('userId', '==', user?.uid || '')]);
  const student = students?.[0];

  // Fetch related data
  const { data: rooms } = useCollection<Room>('rooms');
  const room = rooms?.find(r => r.id === student?.roomId);
  
  const { data: fees } = useCollection<Fee>('fees', [where('studentId', '==', student?.id || '')]);
  const pendingFees = fees?.filter(f => f.status === 'pending');

  const { data: complaints } = useCollection<Complaint>('complaints', [where('studentId', '==', student?.id || '')]);

  const stats = [
    { label: 'My Room', value: room ? room.roomNumber : 'Not Assigned', icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Dues', value: pendingFees?.length || 0, icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Active Issues', value: complaints?.filter(c => c.status !== 'resolved').length || 0, icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome, {profile?.name}!</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Here's an overview of your hostel residence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{stat.label}</p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
              </div>
              <div className={`${stat.bg} dark:bg-opacity-10 ${stat.color} p-1.5 rounded-lg border border-current border-opacity-10 shadow-sm`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Bed className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Room Details
            </h2>
          </div>
          
          {room ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 transition-colors">
                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-lg flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-slate-800">
                  <span className="text-[8px] uppercase font-bold text-slate-400 leading-none mb-0.5">Room</span>
                  <span className="text-lg font-black leading-none">{room.roomNumber}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">{room.type} Suite</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                    <MapPin className="w-2.5 h-2.5 text-slate-300 dark:text-slate-600" />
                    Hostel Block A • Level 2
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-700 flex flex-col justify-center transition-colors">
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5">Occupancy</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{room.occupiedCount} out of {room.capacity} beds occupied</p>
                </div>
                <div className="p-3 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-700 flex flex-col justify-center transition-colors">
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5">Room Integrity</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${room.status === 'available' ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`} />
                    <p className={`text-xs font-bold capitalize ${room.status === 'available' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>{room.status}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 transition-colors">
               <AlertCircle className="w-8 h-8 text-orange-300 dark:text-orange-500 mx-auto mb-2 opacity-50" />
               <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Status: Unallocated</p>
               <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Please contact administration for assignment.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Outstanding Dues
            </h2>
          </div>

          {pendingFees && pendingFees.length > 0 ? (
            <div className="space-y-2">
              {pendingFees.map(fee => (
                <div key={fee.id} className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-lg transition-colors">
                  <div>
                    <p className="text-xs font-bold text-rose-900 dark:text-rose-300">${fee.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium tracking-tight">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-rose-500 dark:bg-rose-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                    Unpaid
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-dashed border-green-100 dark:border-green-900/30 transition-colors">
               <CheckCircle2 className="w-8 h-8 text-green-300 dark:text-green-600 mx-auto mb-2 opacity-50" />
               <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-tight">Settled</p>
               <p className="text-[10px] text-green-600/70 dark:text-green-500/50 mt-0.5">Your account is fully cleared.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
