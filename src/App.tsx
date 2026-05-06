import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';

// Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminRooms from './pages/AdminRooms';
import AdminStudents from './pages/AdminStudents';
import AdminFees from './pages/AdminFees';
import AdminComplaints from './pages/AdminComplaints';
import AdminVisitors from './pages/AdminVisitors';
import AdminReports from './pages/AdminReports';

import StudentDashboard from './pages/StudentDashboard';
import StudentComplaints from './pages/StudentComplaints';
import StudentFees from './pages/StudentFees';
import StudentVisitors from './pages/StudentVisitors';
import Profile from './pages/Profile';

function PrivateRoute({ children, role }: { children: React.ReactNode, role?: 'admin' | 'student' }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-600">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role && profile?.role !== role) {
    return <Navigate to={profile?.role === 'admin' ? '/admin' : '/student'} />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/rooms" element={<PrivateRoute role="admin"><AdminRooms /></PrivateRoute>} />
            <Route path="/admin/students" element={<PrivateRoute role="admin"><AdminStudents /></PrivateRoute>} />
            <Route path="/admin/fees" element={<PrivateRoute role="admin"><AdminFees /></PrivateRoute>} />
            <Route path="/admin/complaints" element={<PrivateRoute role="admin"><AdminComplaints /></PrivateRoute>} />
            <Route path="/admin/visitors" element={<PrivateRoute role="admin"><AdminVisitors /></PrivateRoute>} />
            <Route path="/admin/reports" element={<PrivateRoute role="admin"><AdminReports /></PrivateRoute>} />
            <Route path="/admin/profile" element={<PrivateRoute role="admin"><Profile /></PrivateRoute>} />
  
            {/* Student Routes */}
            <Route path="/student" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
            <Route path="/student/room" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
            <Route path="/student/profile" element={<PrivateRoute role="student"><Profile /></PrivateRoute>} />
            <Route path="/student/fees" element={<PrivateRoute role="student"><StudentFees /></PrivateRoute>} />
            <Route path="/student/complaints" element={<PrivateRoute role="student"><StudentComplaints /></PrivateRoute>} />
            <Route path="/student/visitors" element={<PrivateRoute role="student"><StudentVisitors /></PrivateRoute>} />
  
            {/* Catch all */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
