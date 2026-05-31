import React, { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';

export function AuthModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user, profile, is2FAVerified, set2FAVerified } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show2FAVerify, setShow2FAVerify] = useState(false);
  const [otp, setOtp] = useState('');

  React.useEffect(() => {
    if (isOpen && user && profile?.is2FAEnabled && !is2FAVerified) {
      setShow2FAVerify(true);
    }
  }, [isOpen, user, profile, is2FAVerified]);

  if (!isOpen) return null;

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userRef = doc(db, 'users', auth.currentUser!.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.twoFactorPIN === otp) {
          set2FAVerified(true);
          onClose();
        } else {
          setError('Yanlış təhlükəsizlik kodu');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Initialize profile if it doesn't exist
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          role: 'user',
          is2FAEnabled: false,
          createdAt: new Date().toISOString()
        });
        onClose();
      } else {
        const data = userSnap.data();
        if (data.is2FAEnabled) {
          setShow2FAVerify(true);
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().is2FAEnabled) {
          setShow2FAVerify(true);
        } else {
          onClose();
        }
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email,
          displayName,
          role: 'user',
          is2FAEnabled: false,
          createdAt: new Date().toISOString()
        });
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (show2FAVerify) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-dense w-full max-w-md relative"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal/20 text-teal">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">2FA Təsdiqi</h2>
            <p className="text-sm text-muted-blue mt-1">Daxil olmaq üçün 6 rəqəmli təhlükəsizlik kodunu daxil edin</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handle2FAVerify} className="space-y-4">
            <div className="space-y-1 text-center">
              <label className="label-xs">Təhlükəsizlik Kodu (PIN)</label>
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-navy border-2 border-teal/20 rounded-xl px-4 py-4 text-center text-2xl font-black tracking-[1em] text-teal focus:border-teal outline-none transition-all"
                required 
                autoFocus
                placeholder="000000"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary-dense w-full py-4 mt-4 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Təsdiqlə və Daxil Ol'}
            </button>
          </form>

          <button 
            onClick={() => {
              auth.signOut();
              setShow2FAVerify(false);
              onClose();
            }}
            className="w-full mt-4 text-[10px] text-muted-blue uppercase font-black hover:text-white transition-colors"
          >
            Ləğv Et və Çıxış Et
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-dense w-full max-w-md relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-blue hover:text-white"
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">
            {isLogin ? 'Xoş Gəlmisiniz' : 'Qeydiyyat'}
          </h2>
          <p className="text-sm text-muted-blue mt-1">
            {isLogin ? 'Hesabınıza daxil olun' : 'Platformaya qoşulun'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="label-xs">Ad Soyad</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field-dense w-full pl-10" 
                  required 
                />
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="label-xs">E-poçt</label>
            <div className="relative">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field-dense w-full pl-10" 
                required 
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="label-xs">Şifrə</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field-dense w-full pl-10" 
                required 
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary-dense w-full py-3 mt-4 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? 'Daxil Ol' : 'Qeydiyyatdan Keç')}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-teal/10"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-navy px-2 text-muted-blue">Və ya</span></div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-white/5 border border-white/10 rounded-md text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google ilə davam et
          </button>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-blue">
          {isLogin ? 'Hesabınız yoxdur?' : 'Artıq hesabınız var?'}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-teal font-black uppercase hover:underline"
          >
            {isLogin ? 'Qeydiyyat' : 'Daxil Ol'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
