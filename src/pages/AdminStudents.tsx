import React, { useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import { Student, Room, Visitor } from '../types';
import { db } from '../lib/firebase';
import { collection, updateDoc, doc, getDoc, runTransaction } from 'firebase/firestore';
import { User, Phone, Mail, Bed, Calendar, Search, Filter, Home, Loader2, AlertCircle, X, CheckCircle2, History, LogIn, LogOut, Clock, MapPin, Users, PhoneCall, Contact, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminStudents() {
  const { data: students } = useCollection<Student>('students');
  const { data: rooms } = useCollection<Room>('rooms');
  const { data: visitors } = useCollection<Visitor>('visitors');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = students?.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignRoom = async (roomId: string | null) => {
    if (!selectedStudent) return;

    try {
      await runTransaction(db, async (transaction) => {
        const studentRef = doc(db, 'students', selectedStudent.id);
        
        // 1. ALL READS FIRST
        const studentDoc = await transaction.get(studentRef);
        if (!studentDoc.exists()) throw new Error("Student record no longer exists");
        const studentData = studentDoc.data() as Student;
        const oldRoomId = studentData.roomId;

        let oldRoomDoc = null;
        if (oldRoomId) {
          oldRoomDoc = await transaction.get(doc(db, 'rooms', oldRoomId));
        }

        let newRoomDoc = null;
        if (roomId && roomId !== oldRoomId) {
          newRoomDoc = await transaction.get(doc(db, 'rooms', roomId));
        }

        // 2. ALL LOGIC AND WRITES SECOND
        // Skip if already assigned to this room
        if (oldRoomId === roomId) return;

        // Process old room vacate
        if (oldRoomId && oldRoomDoc?.exists()) {
          const oldRoomData = oldRoomDoc.data() as Room;
          const newCount = Math.max(0, (oldRoomData.occupiedCount || 0) - 1);
          const currentStatus = oldRoomData.status;
          
          let nextStatus = currentStatus;
          if (currentStatus === 'full' && newCount < oldRoomData.capacity) {
            nextStatus = 'available';
          }
          
          transaction.update(oldRoomDoc.ref, { 
            occupiedCount: newCount,
            status: nextStatus
          });
        }

        // Process new room assign
        if (roomId && newRoomDoc) {
          if (!newRoomDoc.exists()) throw new Error("Target room no longer exists");
          
          const roomData = newRoomDoc.data() as Room;
          const currentCount = Number(roomData.occupiedCount || 0);
          const capacity = Number(roomData.capacity || 0);

          if (currentCount >= capacity) {
            throw new Error("Target room has reached its maximum capacity");
          }

          const newCount = currentCount + 1;
          const currentStatus = roomData.status;
          
          let nextStatus = currentStatus;
          if (currentStatus !== 'maintenance') {
            nextStatus = newCount >= capacity ? 'full' : 'available';
          }

          transaction.update(newRoomDoc.ref, { 
            occupiedCount: newCount,
            status: nextStatus
          });
        }

        // Update student's room assignment
        transaction.update(studentRef, { roomId });
      });

      setIsAssignModalOpen(false);
      setSelectedStudent(null);
    } catch (err: any) {
      console.error("Assignment error:", err);
      alert(err.message || "Failed to update room assignment.");
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!window.confirm(`Are you sure you want to remove ${student.name}? This will also vacate their assigned room.`)) {
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const studentRef = doc(db, 'students', student.id);
        const userRef = doc(db, 'users', student.userId);

        // 1. Vacate room if assigned
        if (student.roomId) {
          const roomRef = doc(db, 'rooms', student.roomId);
          const roomDoc = await transaction.get(roomRef);
          if (roomDoc.exists()) {
            const roomData = roomDoc.data() as Room;
            const newCount = Math.max(0, (roomData.occupiedCount || 0) - 1);
            let nextStatus = roomData.status;
            
            if (roomData.status === 'full' && newCount < roomData.capacity) {
              nextStatus = 'available';
            }

            transaction.update(roomRef, {
              occupiedCount: newCount,
              status: nextStatus
            });
          }
        }

        // 2. Delete student and associated user account records
        transaction.delete(studentRef);
        transaction.delete(userRef);
      });
    } catch (err: any) {
      console.error("Delete error:", err);
      alert("Failed to delete student. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-xs text-slate-500">Manage student records and room assignments.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Student</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Room Status</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents?.map((student) => {
                const room = rooms?.find(r => r.id === student.roomId);
                return (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold border border-blue-100">
                          {student.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900">{student.name}</p>
                            <span className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter ${
                              student.gender === 'female' ? 'bg-pink-50 text-pink-600 border border-pink-100' :
                              student.gender === 'male' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                              'bg-indigo-50 text-indigo-600 border border-indigo-100'
                            }`}>
                              {student.gender || 'other'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">Joined {new Date(student.joiningDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {student.email}
                        </p>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {student.phone || 'No phone'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {room ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[10px] font-bold border border-green-100">
                          <Home className="w-3 h-3" />
                          Room {room.roomNumber}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-[10px] font-bold border border-orange-100">
                          <AlertCircle className="w-3 h-3" />
                          Not Assigned
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 text-right">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsDetailsModalOpen(true);
                          }}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight"
                          title="View Details"
                        >
                          <Info className="w-3.5 h-3.5" />
                          Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsVisitorModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight"
                          title="Visitor History"
                        >
                          <History className="w-3.5 h-3.5" />
                          History
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsAssignModalOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight"
                        >
                          <Bed className="w-3.5 h-3.5" />
                          {room ? 'Change' : 'Assign'}
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete Student"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!filteredStudents || filteredStudents.length === 0) && (
            <div className="p-8 text-center">
              <p className="text-xs text-slate-400 italic">No students found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 overflow-hidden border border-gray-200"
            >
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-slate-900">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Assign Room <span className="text-blue-400 ml-1">({selectedStudent?.name})</span>
                </h2>
                <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                {selectedStudent?.roomId && (
                  <button
                    onClick={() => handleAssignRoom(null)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-rose-100 hover:border-rose-200 hover:bg-rose-50 transition-all text-left mb-4 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-rose-700 uppercase tracking-tight">Unassign Room</p>
                      <p className="text-[10px] text-rose-600/70 font-medium">Vacate the current bed</p>
                    </div>
                  </button>
                )}
                
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Available Rooms</p>
                {rooms?.filter(r => r.status === 'available' || r.id === selectedStudent?.roomId).map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleAssignRoom(room.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                      room.id === selectedStudent?.roomId 
                        ? 'border-blue-600 bg-blue-50/50' 
                        : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Room {room.roomNumber}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
                        {room.type} • {room.occupiedCount} out of {room.capacity} beds occupied
                      </p>
                    </div>
                    {room.id === selectedStudent?.roomId ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
                    )}
                  </button>
                ))}
                {rooms?.filter(r => r.status === 'available' || r.id === selectedStudent?.roomId).length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    No available rooms found.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDetailsModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      Student Details
                    </h2>
                    <p className="text-[10px] text-indigo-300 font-medium">Personal & Guardian Information</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-sm border border-slate-200 overflow-hidden">
                    {selectedStudent.photoURL ? (
                      <img src={selectedStudent.photoURL} alt={selectedStudent.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedStudent.name}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{selectedStudent.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-black uppercase tracking-tighter">
                         Room {rooms?.find(r => r.id === selectedStudent.roomId)?.roomNumber || 'N/A'}
                       </span>
                       <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-tighter">
                         {selectedStudent.gender}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        Personal Contact
                      </p>
                      <p className="text-xs font-bold text-slate-700">{selectedStudent.phone || 'N/A'}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        Home Address
                      </p>
                      <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                        {selectedStudent.homeAddress || 'No address provided'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Contact className="w-3 h-3" />
                        Guardian
                      </p>
                      <p className="text-xs font-bold text-slate-700">{selectedStudent.parentsName || 'N/A'}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <PhoneCall className="w-3 h-3" />
                        Guardian Contact
                      </p>
                      <p className="text-xs font-bold text-slate-700">{selectedStudent.parentsContact || 'N/A'}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" />
                        Emergency
                      </p>
                      <p className="text-xs font-bold text-rose-600 underline underline-offset-4 decoration-rose-200">
                        {selectedStudent.emergencyContact || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                   <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-6 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-slate-200 uppercase tracking-wider"
                  >
                    Close Record
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVisitorModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVisitorModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative z-10 overflow-hidden border border-gray-200"
            >
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                    <History className="w-4 h-4" />
                  </div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    Visitor History <span className="text-blue-400 ml-1">• {selectedStudent.name}</span>
                  </h2>
                </div>
                <button onClick={() => setIsVisitorModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-0 max-h-[70vh] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visitor</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Purpose</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Timing</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visitors?.filter(v => v.studentId === selectedStudent.id)
                      .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
                      .map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                              <User className="w-3 h-3" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{log.visitorName}</p>
                              <p className="text-[10px] text-slate-400">{new Date(log.visitDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-600 truncate max-w-[200px]" title={log.purpose}>
                            {log.purpose}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase">
                              <LogIn className="w-3 h-3" />
                              {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {log.checkOut ? (
                              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase">
                                <LogOut className="w-3 h-3" />
                                {new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-[10px] font-bold text-orange-500 uppercase italic">
                                <Clock className="w-3 h-3 animate-pulse" />
                                In Premise
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {log.checkOut ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-tight border border-slate-200">
                              Logged Out
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-green-100 text-green-600 text-[9px] font-bold uppercase tracking-tight border border-green-200">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!visitors || visitors.filter(v => v.studentId === selectedStudent.id).length === 0) && (
                  <div className="p-12 text-center">
                    <History className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-xs text-slate-400 font-medium">No visitor logs found for this student.</p>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-right">
                <button
                  onClick={() => setIsVisitorModalOpen(false)}
                  className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-gray-50 transition-colors uppercase tracking-wider"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
