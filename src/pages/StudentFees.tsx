import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { Student, Fee, HostelSettings } from '../types';
import { where } from 'firebase/firestore';
import { CreditCard, CheckCircle2, Clock, Calendar, DollarSign, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

export default function StudentFees() {
  const { user } = useAuth();
  const { data: students } = useCollection<Student>('students', [where('userId', '==', user?.uid || '')]);
  const student = students?.[0];
  
  const { data: fees } = useCollection<Fee>('fees', [where('studentId', '==', student?.id || '')]);
  const { data: settingsList } = useCollection<HostelSettings>('settings');
  const settings = settingsList?.[0];

  const getFeeStats = () => {
    if (!student || !settings) return { total: 0, paid: 0, balance: 0 };
    
    const totalTarget = student.gender === 'male' ? settings.maleFee : student.gender === 'female' ? settings.femaleFee : settings.otherFee;
    const paidAmount = fees
      ?.filter(f => f.status === 'paid')
      .reduce((sum, f) => sum + f.amount, 0) || 0;
    
    return {
      total: totalTarget,
      paid: paidAmount,
      balance: Math.max(0, totalTarget - paidAmount)
    };
  };

  const stats = getFeeStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hostel Fee Summary</h1>
        <p className="text-xs text-slate-500">Overview of your total stay costs and payment status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Hostel Fees</span>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">${stats.total.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Expected for your session</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fees Paid</span>
          </div>
          <p className="text-2xl font-black text-green-600 tracking-tight">${stats.paid.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Confirmed payments</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden"
        >
          <div className={`absolute top-0 right-0 w-1 h-full ${stats.balance > 0 ? 'bg-rose-500' : 'bg-green-500'}`} />
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${stats.balance > 0 ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'}`}>
              <TrendingDown className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining Balance</span>
          </div>
          <p className={`text-2xl font-black tracking-tight ${stats.balance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
            ${stats.balance.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Due before completion</p>
        </motion.div>
      </div>

      {stats.total > 0 && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Payment Progress</span>
            <span className="text-xs font-bold text-slate-900">{Math.round((stats.paid / stats.total) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (stats.paid / stats.total) * 100)}%` }}
              className={`h-full transition-all ${
                (stats.paid / stats.total) >= 1 ? 'bg-green-500' : 
                (stats.paid / stats.total) >= 0.5 ? 'bg-blue-500' : 'bg-orange-500'
              }`}
            />
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-slate-400" />
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detailed Payment History</h2>
        </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Due Date</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Paid Date</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fees?.sort((a,b) => b.dueDate.localeCompare(a.dueDate)).map((fee) => (
                <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-slate-900">${fee.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600">{new Date(fee.dueDate).toLocaleDateString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400 font-medium">
                      {fee.paidDate ? new Date(fee.paidDate).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                      fee.status === 'paid' 
                      ? 'bg-green-50 text-green-600 border-green-100' 
                      : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {fee.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {fee.status}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!fees || fees.length === 0) && (
            <div className="p-8 text-center text-slate-400 text-xs italic bg-gray-50/20">No fee records found for your account.</div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}
