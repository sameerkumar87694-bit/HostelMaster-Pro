export type UserRole = 'admin' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  photoURL?: string;
  parentsName?: string;
  homeAddress?: string;
  parentsContact?: string;
  emergencyContact?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  type: string;
  capacity: number;
  occupiedCount: number;
  status: 'available' | 'full' | 'maintenance';
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  roomId: string | null;
  joiningDate: string;
  photoURL?: string;
  parentsName?: string;
  homeAddress?: string;
  parentsContact?: string;
  emergencyContact?: string;
}

export interface HostelSettings {
  id: 'fees';
  maleFee: number;
  femaleFee: number;
  otherFee: number;
}

export interface Fee {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: 'pending' | 'paid';
}

export interface Complaint {
  id: string;
  studentId: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  submittedDate: string;
  resolvedDate: string | null;
}

export interface Visitor {
  id: string;
  studentId: string;
  visitorName: string;
  purpose: string;
  visitDate: string;
  checkIn: string;
  checkOut: string | null;
}
