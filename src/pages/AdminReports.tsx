import React, { useState, useMemo } from 'react';
import { useCollection } from '../hooks/useCollection';
import { Room, Fee, Complaint, Student, HostelSettings } from '../types';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Home,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminReports() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1).toISOString().split('T')[0]
  });

  const { data: rooms } = useCollection<Room>('rooms');
  const { data: fees } = useCollection<Fee>('fees');
  const { data: complaints } = useCollection<Complaint>('complaints');
  const { data: students } = useCollection<Student>('students');
  const { data: settingsList } = useCollection<HostelSettings>('settings');
  const settings = settingsList?.[0];

  // Filtered Analytics
  const analytics = useMemo(() => {
    if (!rooms || !fees || !complaints || !students) return null;

    const filteredFees = fees.filter(f => {
      const date = (f.dueDate || '').slice(0, 10);
      if (!date) return false;
      return date >= dateRange.start && date <= dateRange.end;
    });

    const filteredComplaints = complaints.filter(c => {
      const date = (c.submittedDate || '').slice(0, 10);
      if (!date) return false;
      return date >= dateRange.start && date <= dateRange.end;
    });

    // 1. Room Occupancy
    const totalRooms = rooms.length;
    const occupiedBeds = rooms.reduce((acc, r) => acc + Number(r.occupiedCount || 0), 0);
    const totalCapacity = rooms.reduce((acc, r) => acc + Number(r.capacity || 0), 0);
    const vacantBeds = Math.max(0, totalCapacity - occupiedBeds);
    const occupancyRate = totalCapacity > 0 ? (occupiedBeds / totalCapacity) * 100 : 0;

    // 2. Fee Collection (Issued Invoices)
    const filteredFeesInPeriod = fees.filter(f => {
      const date = (f.paidDate || f.dueDate || '').slice(0, 10);
      return (date || '') >= dateRange.start && (date || '') <= dateRange.end;
    });

    const totalFeesPaidInPeriod = fees
      .filter(f => f.status === 'paid' && (f.paidDate || '').slice(0, 10) >= dateRange.start && (f.paidDate || '').slice(0, 10) <= dateRange.end)
      .reduce((acc, f) => acc + Number(f.amount || 0), 0);

    const totalFeesDue = filteredFees.reduce((acc, f) => acc + Number(f.amount || 0), 0);
    const paidInvoicedAmount = filteredFees.filter(f => f.status === 'paid').reduce((acc, f) => acc + Number(f.amount || 0), 0);
    const invoiceCollectionRate = totalFeesDue > 0 ? (paidInvoicedAmount / totalFeesDue) * 100 : 0;

    // 3. Overall Session Projection (Potential Revenue)
    let potentialRevenue = 0;
    const defaultFees = { male: 1000, female: 1000, other: 1000 };
    const maleFee = settings?.maleFee || defaultFees.male;
    const femaleFee = settings?.femaleFee || defaultFees.female;
    const otherFee = settings?.otherFee || defaultFees.other;

    students.forEach(s => {
      if (s.gender === 'male') potentialRevenue += maleFee;
      else if (s.gender === 'female') potentialRevenue += femaleFee;
      else potentialRevenue += otherFee;
    });

    // Total actual collected (all time)
    const actualCollectedTotal = fees
      .filter(f => f.status === 'paid')
      .reduce((acc, f) => {
        const val = Number(f.amount);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);

    const sessionCollectionRate = potentialRevenue > 0 ? (actualCollectedTotal / potentialRevenue) * 100 : 0;
    const complaintsTotalLifetime = complaints.length;

    // 4. Complaint Analysis
    const complaintsByStatus = {
      pending: filteredComplaints.filter(c => c.status === 'pending').length,
      'in-progress': filteredComplaints.filter(c => c.status === 'in-progress').length,
      resolved: filteredComplaints.filter(c => c.status === 'resolved').length,
      total: filteredComplaints.length
    };

    return {
      occupancy: { totalRooms, totalCapacity, occupiedBeds, vacantBeds, occupancyRate },
      fees: { 
        totalFeesDue, 
        totalFeesPaid: totalFeesPaidInPeriod, 
        outstandingBalance: totalFeesDue - paidInvoicedAmount, 
        invoiceCollectionRate,
        sessionCollectionRate,
        totalTransactions: filteredFees.length,
        potentialRevenue,
        actualCollected: actualCollectedTotal,
        sessionBalance: Math.max(0, potentialRevenue - actualCollectedTotal),
        totalFeesPaidLifetime: actualCollectedTotal
      },
      complaints: {
        ...complaintsByStatus,
        lifetime: complaintsTotalLifetime
      }
    };
  }, [rooms, fees, complaints, students, settings, dateRange]);

  const handlePrint = () => {
    window.print();
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Reporting & Analytics
          </h1>
          <p className="text-xs text-slate-500">Generate and export system performance reports.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 transition-all focus-within:ring-1 focus-within:ring-blue-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent border-0 text-[10px] font-bold text-slate-700 focus:ring-0 outline-none p-0 uppercase"
            />
            <span className="text-gray-300 text-xs">—</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent border-0 text-[10px] font-bold text-slate-700 focus:ring-0 outline-none p-0 uppercase"
            />
          </div>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Room Occupancy Report */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 flex items-center gap-2">
            <Home className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Room Occupancy</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Occupancy Rate</p>
                <p className="text-2xl font-black text-slate-900">{analytics.occupancy.occupancyRate.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-blue-50 border-t-blue-600 flex items-center justify-center">
                 <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total Beds</p>
                <p className="text-sm font-bold text-slate-700">{analytics.occupancy.totalCapacity}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-[10px] font-bold text-blue-400 uppercase">Occupied</p>
                <p className="text-sm font-bold text-blue-700">{analytics.occupancy.occupiedBeds}</p>
              </div>
            </div>

            <table className="w-full text-left mt-4">
              <tbody className="divide-y divide-gray-50">
                <tr className="text-[11px]">
                  <td className="py-2 text-gray-500">Total Rooms</td>
                  <td className="py-2 font-bold text-slate-900 text-right">{analytics.occupancy.totalRooms}</td>
                </tr>
                <tr className="text-[11px]">
                  <td className="py-2 text-gray-500">Vacant Beds</td>
                  <td className="py-2 font-bold text-green-600 text-right">{analytics.occupancy.vacantBeds}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* 2. Fee Collection Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Fee Collection</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Goal Progress</p>
                <p className="text-2xl font-black text-slate-900">{analytics.fees.sessionCollectionRate.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-emerald-50 border-t-emerald-600 flex items-center justify-center">
                 <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                <span>Session Completion</span>
                <span>{analytics.fees.sessionCollectionRate.toFixed(1)}%</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${analytics.fees.sessionCollectionRate}%` }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-400 uppercase">Paid Total</p>
                <p className="text-sm font-bold text-emerald-700">${analytics.fees.actualCollected.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-[10px] font-bold text-red-300 uppercase">Hostel Balance</p>
                <p className="text-sm font-bold text-red-600">${analytics.fees.sessionBalance.toLocaleString()}</p>
              </div>
            </div>

            <table className="w-full text-left mt-4">
              <tbody className="divide-y divide-gray-50">
                <tr className="text-[11px]">
                  <td className="py-2 text-gray-500">Invoice Pay-rate</td>
                  <td className="py-2 font-bold text-slate-900 text-right">{analytics.fees.invoiceCollectionRate.toFixed(1)}%</td>
                </tr>
                <tr className="text-[11px]">
                  <td className="py-2 text-gray-500">Session Goal</td>
                  <td className="py-2 font-bold text-slate-900 text-right">${analytics.fees.potentialRevenue.toLocaleString()}</td>
                </tr>
                <tr className="text-[11px]">
                  <td className="py-2 text-gray-500">Issued Invoices</td>
                  <td className="py-2 font-bold text-slate-600 text-right">${analytics.fees.totalFeesDue.toLocaleString()}</td>
                </tr>
                <tr className="text-[11px]">
                  <td className="py-2 text-gray-500">Total Transactions</td>
                  <td className="py-2 font-bold text-slate-900 text-right">{analytics.fees.totalTransactions}</td>
                </tr>
                <tr className="text-[11px] bg-slate-50/50">
                  <td className="py-2 text-blue-600 font-bold">Lifetime Collected</td>
                  <td className="py-2 font-bold text-blue-700 text-right">${analytics.fees.totalFeesPaidLifetime.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* 3. Complaint Analysis */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-orange-500" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Complaint Analysis</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resolution Efficiency</p>
                <p className="text-2xl font-black text-slate-900">
                  {analytics.complaints.total > 0 
                    ? ((analytics.complaints.resolved / analytics.complaints.total) * 100).toFixed(1) 
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-orange-50 border-t-orange-500 flex items-center justify-center">
                 <Clock className="w-5 h-5 text-orange-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-2 bg-orange-50 rounded-lg border border-orange-100 text-center">
                <p className="text-[8px] font-black text-orange-400 uppercase">Pending</p>
                <p className="text-xs font-bold text-orange-600">{analytics.complaints.pending}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-center">
                <p className="text-[8px] font-black text-blue-400 uppercase">Ongoing</p>
                <p className="text-xs font-bold text-blue-600">{analytics.complaints['in-progress']}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg border border-green-100 text-center">
                <p className="text-[8px] font-black text-green-400 uppercase">Solved</p>
                <p className="text-xs font-bold text-green-600">{analytics.complaints.resolved}</p>
              </div>
            </div>

            <table className="w-full text-left mt-4">
              <tbody className="divide-y divide-gray-50">
                <tr className="text-[11px]">
                  <td className="py-2 text-gray-500">Total Submissions</td>
                  <td className="py-2 font-bold text-slate-900 text-right">{analytics.complaints.total}</td>
                </tr>
                <tr className="text-[11px] bg-slate-50/50">
                  <td className="py-2 text-blue-600 font-bold">Lifetime Record</td>
                  <td className="py-2 font-bold text-blue-700 text-right">{analytics.complaints.lifetime} tickets</td>
                </tr>
                <tr className="text-[11px]">
                  <td className="py-2 text-gray-500">Priority Tickets</td>
                  <td className="py-2 font-bold text-red-500 text-right">{analytics.complaints.pending}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Detailed Data Table */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-gray-100 bg-slate-900 flex justify-between items-center">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Metrics Breakdown</h2>
          <span className="text-[10px] text-slate-400 font-medium">Data accurate as of {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">KPI Category</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Metric Detail</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Value</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Benchmark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 text-xs font-bold text-slate-900">Room Occupancy</td>
                <td className="px-4 py-3 text-xs text-slate-600">Total Resident Count</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-900 text-right">{analytics.occupancy.occupiedBeds}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                    Target: 95%
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-xs font-bold text-slate-900">Fee Collection</td>
                <td className="px-4 py-3 text-xs text-slate-600">Arrears/Outstanding Balance</td>
                <td className="px-4 py-3 text-xs font-bold text-red-600 text-right">${analytics.fees.outstandingBalance.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold">
                    Target: 100%
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-xs font-bold text-slate-900">Complaints</td>
                <td className="px-4 py-3 text-xs text-slate-600">Pending Resolution Time</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-900 text-right">{analytics.complaints.pending} active</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold">
                    Goal: 24h
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
