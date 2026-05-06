import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserCircle, Mail, Phone, User, Save, Loader2, CheckCircle2, AlertCircle, Camera, MapPin, Users, PhoneCall, Contact } from 'lucide-react';
import { motion } from 'motion/react';
import { getFriendlyErrorMessage } from '../utils/errorUtils';

export default function Profile() {
  const { user, profile, setProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: '',
    gender: profile?.gender || 'male' as 'male' | 'female' | 'other',
    parentsName: '',
    homeAddress: '',
    parentsContact: '',
    emergencyContact: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAdditionalData = async () => {
      if (!user) return;
      
      try {
        if (profile?.role === 'student') {
          const studentDoc = await getDoc(doc(db, 'students', user.uid));
          if (studentDoc.exists()) {
            const data = studentDoc.data();
            setFormData({
              name: profile?.name || '',
              phone: data.phone || '',
              gender: data.gender || 'male',
              parentsName: data.parentsName || '',
              homeAddress: data.homeAddress || '',
              parentsContact: data.parentsContact || '',
              emergencyContact: data.emergencyContact || '',
            });
          }
        } else {
            // For admin, we might only have basic info
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setFormData({
                name: profile?.name || '',
                phone: data.phone || '',
                gender: data.gender || 'male',
                parentsName: data.parentsName || '',
                homeAddress: data.homeAddress || '',
                parentsContact: data.parentsContact || '',
                emergencyContact: data.emergencyContact || '',
              });
            }
        }
      } catch (err) {
        console.error('Error fetching profile details:', err);
      }
    };

    if (profile) {
      fetchAdditionalData();
    }
  }, [user, profile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Basic validation
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const storageRef = ref(storage, `profiles/${user.uid}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        updatedAt: new Date().toISOString(),
      });

      if (profile?.role === 'student') {
        const studentRef = doc(db, 'students', user.uid);
        await updateDoc(studentRef, {
          photoURL: downloadURL,
        });
      }

      // Update sync state
      if (setProfile && profile) {
        setProfile({
          ...profile,
          photoURL: downloadURL,
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // 1. Update the 'users' collection
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        phone: formData.phone,
        gender: formData.gender,
        parentsName: formData.parentsName,
        homeAddress: formData.homeAddress,
        parentsContact: formData.parentsContact,
        emergencyContact: formData.emergencyContact,
        updatedAt: new Date().toISOString(),
      });

      // 2. Update the 'students' collection if the user is a student
      if (profile?.role === 'student') {
        const studentRef = doc(db, 'students', user.uid);
        await updateDoc(studentRef, {
          name: formData.name,
          phone: formData.phone,
          gender: formData.gender,
          parentsName: formData.parentsName,
          homeAddress: formData.homeAddress,
          parentsContact: formData.parentsContact,
          emergencyContact: formData.emergencyContact,
        });
      }

      // 3. Update local sync state
      if (setProfile && profile) {
        setProfile({
          ...profile,
          name: formData.name,
          phone: formData.phone,
          gender: formData.gender,
          parentsName: formData.parentsName,
          homeAddress: formData.homeAddress,
          parentsContact: formData.parentsContact,
          emergencyContact: formData.emergencyContact,
        } as any);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(getFriendlyErrorMessage(err));
      try {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      } catch (systemErr) {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          My Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Manage your personal information and contact details.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
      >
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900" />
        
        <div className="px-8 pb-8">
          <div className="relative -mt-12 mb-6">
            <div 
              className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 p-1 shadow-lg cursor-pointer group relative overflow-hidden transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-full h-full rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 overflow-hidden">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                ) : profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-10 h-10" />
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    Basic Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all"
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="tel"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all"
                          placeholder="Enter your phone number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Gender</label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <select
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all appearance-none"
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Home Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <textarea
                          rows={3}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all resize-none"
                          placeholder="Your complete home address"
                          value={formData.homeAddress}
                          onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 flex items-center gap-2">
                     <AlertCircle className="w-3 h-3" />
                     Account Status
                   </p>
                   <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Email:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{user?.email}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Role:</span>
                      <span className="font-medium text-slate-900 dark:text-white capitalize px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-[10px] font-bold">
                        {profile?.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    Guardian & Emergency
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Parent's Name</label>
                      <div className="relative">
                        <Contact className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none transition-all"
                          placeholder="Father/Mother name"
                          value={formData.parentsName}
                          onChange={(e) => setFormData({ ...formData, parentsName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Parent's Contact</label>
                      <div className="relative">
                        <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="tel"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none transition-all"
                          placeholder="Parent's phone number"
                          value={formData.parentsContact}
                          onChange={(e) => setFormData({ ...formData, parentsContact: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Emergency Number</label>
                      <div className="relative">
                        <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="tel"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-rose-500 dark:text-white outline-none transition-all"
                          placeholder="Emergency contact (alternative)"
                          value={formData.emergencyContact}
                          onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {error && (
                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 p-3 rounded-lg flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium transition-colors">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 p-3 rounded-lg flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-medium animate-in fade-in slide-in-from-top-1 transition-colors">
                      <CheckCircle2 className="w-4 h-4" />
                      Profile updated successfully!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 dark:shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Profile Details
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
