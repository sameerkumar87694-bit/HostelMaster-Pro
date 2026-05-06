import React, { useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import { Fee, Student, HostelSettings } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, setDoc } from 'firebase/firestore';
import { Plus, CreditCard, Check, Clock, Search, Filter, X, User, ChevronDown, ChevronUp, History, DollarSign, Settings, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminFees() {
  const { data: fees } = useCollection<Fee>('fees');
  const { data: students } = useCollection<Student>('students');
  const { data: settingsList } = useCollection<HostelSettings>('settings');
  const settings = settingsList?.[0];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFeeId, setExpandedFeeId] = useState<string | null>(null);

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const feeData = {
      studentId: formData.get('studentId') as string,
      amount: Number(formData.get('amount')),
      dueDate: new Date(formData.get('dueDate') as string).toISOString(),
      status: 'pending',
      paidDate: null,
    };

    try {
      await addDoc(collection(db, 'fees'), feeData);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newSettings = {
      maleFee: Number(formData.get('maleFee')),
      femaleFee: Number(formData.get('femaleFee')),
      otherFee: Number(formData.get('otherFee')),
    };

    try {
      await setDoc(doc(db, 'settings', 'fees'), newSettings);
      setIsSettingsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      await updateDoc(doc(db, 'fees', id), {
        status: 'paid',
        paidDate: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedFeeId(expandedFeeId === id ? null : id);
  };

  const getStudentFeeInfo = (student: Student) => {
    const totalTarget = settings 
      ? (student.gender === 'male' ? settings.maleFee : student.gender === 'female' ? settings.femaleFee : settings.otherFee)
      : 0;
    
    const paidAmount = fees
      ?.filter(f => f.studentId === student.id && f.status === 'paid')
      .reduce((sum, f) => sum + f.amount, 0) || 0;
    
    return {
      total: totalTarget,
      paid: paidAmount,
      balance: Math.max(0, totalTarget - paidAmount)
    };
  };

  const filteredFees = fees?.filter(fee => {
    const student = students?.find(s => s.id === fee.studentId);
    const searchLow = searchTerm.toLowerCase();
    return student?.name.toLowerCase().includes(searchLow);
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Fee Management</h1>
          <p className="text-xs text-slate-500">Track payments and generate new fee records.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all w-64"
            />
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Configure Hostel Fees"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Fee Record
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="w-10 px-4 py-2"></th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Student</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Session Bill</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Overall Balance</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Due Date</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFees?.map((fee) => {
                const student = students?.find(s => s.id === fee.studentId);
                const isExpanded = expandedFeeId === fee.id;
                const studentHistory = fees?.filter(f => f.studentId === fee.studentId && f.id !== fee.id)
                  .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
                
                const { total, paid, balance } = student ? getStudentFeeInfo(student) : { total: 0, paid: 0, balance: 0 };

                return (
                  <React.Fragment key={fee.id}>
                    <tr 
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30' : ''}`}
                      onClick={() => toggleExpand(fee.id)}
                    >
                      <td className="px-4 py-3">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{student?.name || 'Unknown Student'}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-medium">{student?.gender || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-slate-900 tracking-tight">${fee.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${balance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                            ${balance.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                            of ${total.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{new Date(fee.dueDate).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          fee.status === 'paid' 
                          ? 'bg-green-50 text-green-600 border-green-100' 
                          : 'bg-orange-50 text-orange-600 border-orange-100 font-extrabold'
                        }`}>
                          {fee.status === 'paid' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {fee.status.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {fee.status === 'pending' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsPaid(fee.id);
                              }}
                              className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm transition-all uppercase tracking-tight"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-0 border-none">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-slate-50 shadow-inner"
                            >
                              <div className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                  <History className="w-4 h-4 text-blue-600" />
                                  <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Payment History for {student?.name}</h3>
                                </div>
                                
                                {studentHistory && studentHistory.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {studentHistory.map((hist) => (
                                      <div key={hist.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
                                        <div className={`absolute top-0 right-0 w-1 h-full ${hist.status === 'paid' ? 'bg-green-500' : 'bg-orange-500'}`} />
                                        <div className="flex justify-between items-start mb-2">
                                          <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Billing Amount</p>
                                            <p className="text-sm font-black text-slate-900">${hist.amount.toLocaleString()}</p>
                                          </div>
                                          <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                            hist.status === 'paid' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                                          }`}>
                                            {hist.status}
                                          </div>
                                        </div>
                                        <div className="space-y-1.5">
                                          <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-slate-500">Due Date:</span>
                                            <span className="font-bold text-slate-700">{new Date(hist.dueDate).toLocaleDateString()}</span>
                                          </div>
                                          {hist.paidDate && (
                                            <div className="flex items-center justify-between text-[10px]">
                                              <span className="text-slate-500">Paid On:</span>
                                              <span className="font-bold text-green-600">{new Date(hist.paidDate).toLocaleDateString()}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 bg-white rounded-lg border border-dashed border-slate-200">
                                    <DollarSign className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                                    <p className="text-[10px] text-slate-400 font-medium">No previous payment records found for this student.</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {(!filteredFees || filteredFees.length === 0) && (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              {searchTerm ? 'No matches found for your search.' : 'No fee records found.'}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden border border-gray-200"
            >
              <div className="px-4 py-3 bg-indigo-600 flex justify-between items-center border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-white" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">Hostel Fee Settings</h2>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleSaveSettings} className="p-5 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Default Fee for Boys</label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="number" 
                        name="maleFee" 
                        defaultValue={settings?.maleFee || 1000}
                        required 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Default Fee for Girls</label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="number" 
                        name="femaleFee" 
                        defaultValue={settings?.femaleFee || 1000}
                        required 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fee for Others</label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="number" 
                        name="otherFee" 
                        defaultValue={settings?.otherFee || 1000}
                        required 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-100 uppercase tracking-wider transition-all active:scale-[0.98]"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Settings
                </button>
              </form>
            </motion.div>
          </div>
        )}

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
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Create Fee Record</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleCreateFee} className="p-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Student</label>
                  <select 
                    name="studentId" 
                    required 
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  >
                    <option value="">Select a student...</option>
                    {students?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount ($)</label>
                    <input 
                      type="number" 
                      name="amount" 
                      required 
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
                    <input 
                      type="date" 
                      name="dueDate" 
                      required 
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                    />
                  </div>
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
                    Create Record
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
