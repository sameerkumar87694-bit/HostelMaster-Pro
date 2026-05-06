import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Bed, Mail, Lock, User, Loader2, Chrome } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [role, setRole] = useState<'admin' | 'student'>('student');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setResetLoading(true);
    setError('');
    setSuccess('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset link sent! Check your inbox.');
      setShowForgotPassword(false);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else {
        setError(err.message || 'Failed to send reset email');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // New user from Google
        const userData = {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || 'Guest User',
          role: 'student', // Default new Google users to students
        };
        
        await setDoc(userDocRef, userData);
        
        await setDoc(doc(db, 'students', user.uid), {
          id: user.uid,
          userId: user.uid,
          name: userData.name,
          email: userData.email,
          phone: '',
          roomId: null,
          joiningDate: new Date().toISOString(),
        });
        
        navigate('/student');
      } else {
        const profile = userDoc.data();
        if (profile?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (!userDoc.exists()) {
          setError('Account exists but profile is missing. Please switch to Sign Up to complete your registration.');
          // Optionally we could auto-switch state or allow them to finish here
          return;
        }

        const profile = userDoc.data();
        if (profile?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      } else {
        let user;
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          user = userCredential.user;
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-in-use') {
            // Check if profile exists
            const existingUserCredential = await signInWithEmailAndPassword(auth, email, password).catch(() => null);
            if (existingUserCredential) {
              const checkDoc = await getDoc(doc(db, 'users', existingUserCredential.user.uid));
              if (!checkDoc.exists()) {
                // Profile is missing, allow creating it
                user = existingUserCredential.user;
              } else {
                throw authErr; // Profile exists, so it truly is already in use
              }
            } else {
              throw authErr;
            }
          } else {
            throw authErr;
          }
        }
        
        if (user) {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email,
            name: name || 'User',
            role,
            createdAt: new Date().toISOString(),
          });

          // If it's a student, we also need to create a record in students collection
          if (role === 'student') {
            await setDoc(doc(db, 'students', user.uid), {
              id: user.uid,
              userId: user.uid,
              name: name || 'User',
              email,
              phone: '',
              gender: gender,
              roomId: null,
              joiningDate: new Date().toISOString(),
            });
            navigate('/student');
          } else {
            navigate('/admin');
          }
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is disabled. Please enable it in the Firebase Console.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. If you have an account, please switch to the Login tab.');
      } else if (err.code === 'auth/network-request-failed' || err.code === 'unavailable' || err.message?.includes('offline')) {
        setError('Connection error. Please check your internet and Firebase configuration.');
      } else {
        setError(err.message || 'An authentication error occurred');
        console.warn('Auth issue:', err.code, err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-600 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transition-colors"
      >
        <div className="p-8 text-center bg-white dark:bg-slate-900">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
            <Bed className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">HostelMaster Pro</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your stay with ease</p>
        </div>

        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${isLogin ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            Login
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${!isLogin ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {!isLogin && (
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all dark:text-white"
                />
              </div>
              
              {role === 'student' && (
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider ${gender === g ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'student' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'admin' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 dark:text-slate-500" />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all dark:text-white"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 dark:text-slate-500" />
            <input
              type="password"
              placeholder="Password"
              required={!showForgotPassword}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all dark:text-white"
            />
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(!showForgotPassword)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
              >
                {showForgotPassword ? 'Back to Login' : 'Forgot Password?'}
              </button>
            </div>
          )}

          {error && (
            <p className="text-red-500 dark:text-red-400 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 py-2 rounded-lg transition-colors">
              {error}
            </p>
          )}

          {success && (
            <p className="text-green-500 dark:text-green-400 text-sm text-center font-medium bg-green-50 dark:bg-green-900/20 py-2 rounded-lg transition-colors">
              {success}
            </p>
          )}

          {showForgotPassword ? (
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 flex items-center justify-center gap-2"
            >
              {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? 'Login' : 'Create Account'}
            </button>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 dark:text-slate-500 font-bold transition-colors">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Chrome className="w-5 h-5 text-red-500" />
            Sign in with Google
          </button>
        </form>

        <div className="px-8 pb-8 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {isLogin ? "Don't have an account? Switch to Sign Up above." : "Already have an account? Switch to Login above."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
