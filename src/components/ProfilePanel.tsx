import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { Loader2, LogOut, User as UserIcon, MapPin, AlignLeft, ShieldCheck, ShieldAlert, Lock } from 'lucide-react';

export function ProfilePanel() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [is2FAEnabled, setIs2FAEnabled] = useState(profile?.is2FAEnabled || false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setIs2FAEnabled(profile.is2FAEnabled || false);
    }
  }, [profile]);

  if (!user) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updates: any = {
        displayName,
        bio,
        location,
        is2FAEnabled,
        updatedAt: new Date().toISOString()
      };
      if (is2FAEnabled && pin) {
        updates.twoFactorPIN = pin;
      }
      await updateDoc(userRef, updates);
      await refreshProfile();
      setIsEditing(false);
      setPin('');
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tight">İstifadəçi Profili</h2>
          <p className="text-sm text-muted-blue">Şəxsi məlumatlarınızı idarə edin</p>
        </div>
        <button 
          onClick={() => signOut()}
          className="flex items-center gap-2 px-4 py-2 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          Çıxış
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-dense flex flex-col items-center text-center p-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal to-orange flex items-center justify-center text-white mb-4 shadow-xl shadow-teal/20 relative">
             <UserIcon className="w-10 h-10" />
             <div className="absolute bottom-1 right-1 w-6 h-6 bg-navy rounded-full border-2 border-teal flex items-center justify-center">
                <div className="w-2 h-2 bg-teal rounded-full animate-pulse" />
             </div>
          </div>
          <h3 className="text-xl font-bold">{profile?.displayName || 'Adsız İstifadəçi'}</h3>
          <p className="text-xs text-muted-blue mt-1">{user.email}</p>
          
          <div className="flex flex-col gap-2 mt-4 w-full">
            <div className={`px-3 py-2 rounded-xl border flex items-center justify-between transition-all ${profile?.is2FAEnabled ? 'bg-teal/5 border-teal/30 text-teal' : 'bg-orange/5 border-orange/30 text-orange'}`}>
              <div className="flex items-center gap-2">
                {profile?.is2FAEnabled ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                <span className="text-[10px] font-black uppercase">2FA: {profile?.is2FAEnabled ? 'Aktiv' : 'Passiv'}</span>
              </div>
              {!profile?.is2FAEnabled && <div className="w-2 h-2 bg-orange rounded-full animate-pulse" />}
            </div>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-muted-blue uppercase tracking-widest text-center">
              {profile?.role || 'İstifadəçi'}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 card-dense">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="label-xs">Görünən Ad</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!isEditing}
                    className="input-field-dense w-full pl-10 disabled:opacity-50"
                  />
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="label-xs">Məkan</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={!isEditing}
                    className="input-field-dense w-full pl-10 disabled:opacity-50"
                    placeholder="Məs: Bakı, Azərbaycan"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="label-xs">Bioqrafiya</label>
              <div className="relative">
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  className="input-field-dense w-full pl-10 resize-none disabled:opacity-50"
                  placeholder="Özünüz haqqında qısa məlumat..."
                />
                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-teal" />
              </div>
            </div>

            <div className="pt-6 border-t border-teal/10">
              <div className={`p-5 rounded-2xl border transition-all ${is2FAEnabled ? 'bg-teal/5 border-teal/30' : 'bg-navy-lighter/30 border-white/5'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${is2FAEnabled ? 'bg-teal/10 border-teal/30 text-teal shadow-[0_0_15px_rgba(45,212,191,0.2)]' : 'bg-white/5 border-white/10 text-muted-blue'}`}>
                      {is2FAEnabled ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">Hesabın Təhlükəsizliyi (2FA)</h4>
                      <p className="text-[10px] text-muted-blue max-w-[200px]">Giriş zamanı 6 rəqəmli təhlükəsizlik kodunun (PIN) tələb olunması.</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => isEditing && setIs2FAEnabled(!is2FAEnabled)}
                    disabled={!isEditing}
                    className={`w-14 h-7 rounded-full relative transition-all ${!isEditing ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} ${is2FAEnabled ? 'bg-teal' : 'bg-navy-lighter border border-white/10'}`}
                  >
                    <motion.div 
                      layout
                      animate={{ x: is2FAEnabled ? 28 : 4 }}
                      className="absolute top-1 left-0 w-5 h-5 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>
                
                {is2FAEnabled && isEditing && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 p-5 bg-orange/10 border border-orange/30 rounded-xl space-y-4 shadow-inner"
                  >
                    <div className="flex items-center gap-2 text-orange">
                      <Lock className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Yeni Təhlükəsizlik PIN-i:</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-navy/50 border-2 border-orange/20 rounded-lg px-4 py-3 text-center tracking-[1.5em] font-black text-2xl text-orange focus:border-orange outline-none transition-all placeholder:text-orange/20"
                        placeholder="••••••"
                      />
                    </div>
                    <p className="text-[9px] text-orange/70 italic flex items-start gap-1">
                      <span className="shrink-0 font-bold">⚠️ DİQQƏT:</span> 
                      Daxil etməsəniz mövcud PIN qüvvədə qalacaq. Əgər ilk dəfədirsə, mütləq təyin edin.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              {isEditing ? (
                <>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary-dense flex-grow flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yadda Saxla'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                        setIsEditing(false);
                        setDisplayName(profile?.displayName || '');
                        setBio(profile?.bio || '');
                        setLocation(profile?.location || '');
                    }}
                    className="px-6 py-2 border border-teal/20 rounded-md text-xs font-bold uppercase tracking-widest hover:bg-white/5"
                  >
                    Ləğv Et
                  </button>
                </>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setIsEditing(true)}
                  className="btn-primary-dense w-full"
                >
                  Məlumatları Yenilə
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
