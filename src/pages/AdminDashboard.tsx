import React from 'react';
import { useCollection } from '../hooks/useCollection';
import { Student, Room, Complaint, Fee, Visitor, HostelSettings } from '../types';
import { where } from 'firebase/firestore';
import { Bed, MessageSquare, CreditCard, Users, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const { data: rooms } = useCollection<Room>('rooms');
  const { data: pendingComplaints } = useCollection<Complaint>('complaints', [where('status', '==', 'pending')]);
  const { data: fees } = useCollection<Fee>('fees');
  const { data: students } = useCollection<Student>('students');
  const { data: visitors } = useCollection<Visitor>('visitors', [where('checkOut', '==', null)]);
  const { data: settingsList } = useCollection<HostelSettings>('settings');
  const settings = settingsList?.[0];

  const getCollectionMetrics = () => {
    if (!students) return { pending: 0, count: 0 };
    
    // Total potential if settings exist
    let potentialRevenue = 0;
    if (settings) {
      students.forEach(s => {
        if (s.gender === 'male') potentialRevenue += settings.maleFee;
        else if (s.gender === 'female') potentialRevenue += settings.femaleFee;
        else potentialRevenue += settings.otherFee;
      });
    }

    const actualCollected = fees
      ?.filter(f => f.status === 'paid')
      .reduce((acc, f) => acc + (f.amount || 0), 0) || 0;
    
    const balance = Math.max(0, potentialRevenue - actualCollected);
    const pendingInvoices = fees?.filter(f => f.status === 'pending').length || 0;

    return { 
      pendingAmount: balance > 0 ? balance : 0, 
      count: pendingInvoices,
      collected: actualCollected
    };
  };

  const collectionMetrics = getCollectionMetrics();

  const totalCapacity = rooms?.reduce((acc, r) => acc + (r.capacity || 0), 0) || 0;
  const occupiedCount = rooms?.reduce((acc, r) => acc + (r.occupiedCount || 0), 0) || 0;
  const occupancyRate = totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 100) : 0;

  const stats = [
    { 
      label: 'Total Rooms', 
      value: rooms?.length || 0, 
      subValue: '+2 added recently',
      subColor: 'text-green-600',
      border: 'border-gray-200'
    },
    { 
      label: 'Occupancy Rate', 
      value: `${occupancyRate}%`, 
      progress: occupancyRate,
      border: 'border-gray-200'
    },
    { 
      label: 'Overall Balance', 
      value: `$${collectionMetrics.pendingAmount.toLocaleString()}`, 
      subValue: `Collected: $${collectionMetrics.collected.toLocaleString()}`,
      subColor: 'text-emerald-500 font-bold',
      border: 'border-l-4 border-l-red-500 border-y-gray-200 border-r-gray-200'
    },
    { 
      label: 'Open Complaints', 
      value: pendingComplaints?.length || 0, 
      subValue: 'Requires attention',
      subColor: 'text-orange-500 italic',
      border: 'border-gray-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm ${stat.border} transition-colors`}
          >
            <p className="text-gray-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">{stat.label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold tracking-tight dark:text-white">{stat.value}</p>
              {stat.subValue && (
                <p className={`text-[10px] font-medium ${stat.subColor}`}>{stat.subValue}</p>
              )}
              {stat.progress !== undefined && (
                <div className="flex-1 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden self-center ml-2">
                  <div className="bg-blue-600 h-full transition-all" style={{ width: `${stat.progress}%` }} />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Density Section */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Recent Complaints Table */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
            <h2 className="text-sm font-bold text-gray-700 dark:text-slate-200">Active Maintenance Issues</h2>
            <button className="text-blue-600 dark:text-blue-400 text-[11px] font-semibold hover:underline">View All Issues</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 font-bold border-b border-gray-100 dark:border-slate-800">
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {pendingComplaints?.slice(0, 5).map((complaint) => {
                  const student = students?.find(s => s.id === complaint.studentId);
                  const room = rooms?.find(r => r.id === student?.roomId);
                  return (
                    <tr key={complaint.id} className="text-xs hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{room?.roomNumber || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{student?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400 max-w-xs truncate">{complaint.description}</td>
                      <td className="px-4 py-3 text-gray-400 text-[10px]">
                        {complaint.submittedDate ? new Date(complaint.submittedDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-orange-500 font-medium capitalize">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                          {complaint.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!pendingComplaints || pendingComplaints.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic text-xs">
                      No pending complaints found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Modules */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between bg-gray-50/50 dark:bg-slate-800/50">
              <h2 className="text-sm font-bold text-gray-700 dark:text-slate-200">Current Visitors</h2>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full text-blue-600 dark:text-blue-400 font-bold">
                {visitors?.length || 0} active
              </span>
            </div>
            <div className="p-2 space-y-1">
              {visitors?.slice(0, 4).map(v => (
                <div key={v.id} className="p-2 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 flex items-center gap-3 transition-all">
                  <div className="w-8 h-8 rounded bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 flex-shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{v.visitorName}</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{v.purpose}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">
                      {new Date(v.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase">In</p>
                  </div>
                </div>
              ))}
              {(!visitors || visitors.length === 0) && (
                <p className="text-[10px] text-gray-400 text-center py-4 italic">No active visitors</p>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 shadow-md">
            <h2 className="text-sm font-bold text-white mb-4">Room Allocation Snap</h2>
            <div className="grid grid-cols-6 gap-2">
              {rooms?.slice(0, 30).map(room => (
                <div 
                  key={room.id}
                  className={`aspect-square rounded-sm shadow-inner ${
                    room.status === 'full' ? 'bg-blue-500' :
                    room.status === 'maintenance' ? 'bg-orange-500' :
                    'bg-slate-700'
                  }`}
                  title={`Room ${room.roomNumber}: ${room.status}`}
                />
              ))}
              {(!rooms || rooms.length === 0) && (
                Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-slate-800 rounded-sm" />
                ))
              )}
            </div>
            <div className="flex justify-between mt-5 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-[9px] text-slate-400">Full</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
                <span className="text-[9px] text-slate-400">Vacant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-[9px] text-slate-400">Repair</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
