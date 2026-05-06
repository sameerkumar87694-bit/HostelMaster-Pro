import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Bed, 
  Users, 
  FileText, 
  MessageSquare, 
  UserCircle, 
  LogOut, 
  Menu, 
  X,
  CreditCard,
  History,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Example "Complaint count" logic if needed, otherwise static for demo as per design
  const complaintCount = 4; 

  const adminNav: NavItem[] = [
    { label: 'Dashboard', path: '/admin', icon: BarChart3 },
    { label: 'Room Allocation', path: '/admin/rooms', icon: Bed },
    { label: 'Fee Management', path: '/admin/fees', icon: CreditCard },
    { label: 'Complaints', path: '/admin/complaints', icon: MessageSquare },
    { label: 'Visitor Logs', path: '/admin/visitors', icon: History },
    { label: 'Reports', path: '/admin/reports', icon: FileText },
    { label: 'Student Directory', path: '/admin/students', icon: Users },
    { label: 'My Profile', path: '/admin/profile', icon: UserCircle },
  ];

  const studentNav: NavItem[] = [
    { label: 'My Dashboard', path: '/student', icon: BarChart3 },
    { label: 'My Room', path: '/student/room', icon: Bed },
    { label: 'My Fees', path: '/student/fees', icon: CreditCard },
    { label: 'Complaints', path: '/student/complaints', icon: MessageSquare },
    { label: 'Visitors', path: '/student/visitors', icon: History },
    { label: 'My Profile', path: '/student/profile', icon: UserCircle },
  ];

  const navItems = profile?.role === 'admin' ? adminNav : studentNav;

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-950 font-sans text-gray-800 dark:text-slate-200 overflow-hidden transition-colors">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-slate-900 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 text-white font-bold text-xl flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Bed className="w-5 h-5 text-white" />
          </div>
          <span>NexusHostel</span>
        </div>
        
        <div className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === item.path 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.label === 'Complaints' && profile?.role === 'admin' && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {complaintCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-400 text-sm mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden border border-slate-700">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                profile?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{profile?.name}</p>
              <p className="text-[10px] capitalize">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-slate-800 rounded-md text-xs font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white tracking-tight">
              {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Search records..." 
                className="bg-gray-100 dark:bg-slate-800 border-0 rounded-lg py-1.5 px-4 text-xs w-64 focus:ring-1 focus:ring-blue-500 dark:text-slate-200 transition-all outline-none"
              />
            </div>
            <button 
              onClick={toggleTheme}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Users className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-6 transition-colors">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {children}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <footer className="h-10 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 transition-colors">
          <div className="flex items-center gap-4 text-[10px] text-gray-500 dark:text-slate-400">
            <span>System Status: <span className="text-green-600 font-bold">Online</span></span>
            <span>DB Connection: <span className="text-gray-400 dark:text-slate-500 font-mono">FIRESTORE_NEXUS</span></span>
            <span>Role: <span className="capitalize">{profile?.role}</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors">Refresh Metrics</button>
            <button className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors">Report Bug</button>
          </div>
        </footer>
      </main>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-64 bg-slate-900 dark:bg-slate-950 z-50 flex flex-col md:hidden border-r border-slate-800 transition-colors"
            >
              <div className="p-6 text-white font-bold text-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <Bed className="w-5 h-5 text-white" />
                  </div>
                  <span>NexusHostel</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                      location.pathname === item.path 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-900"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="p-6 border-t border-slate-800">
                <div className="flex items-center gap-4 mb-6 px-1">
                   <button 
                    onClick={toggleTheme}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 dark:bg-slate-900 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 py-3 text-red-500 font-semibold bg-slate-800 dark:bg-slate-900 rounded-lg transition-colors border border-transparent active:border-red-500"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
