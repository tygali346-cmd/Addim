import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
  is2FAVerified: boolean;
  set2FAVerified: (val: boolean) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [is2FAVerified, setIs2FAVerified] = useState(false);

  const refreshProfile = async () => {
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          // If 2FA is not enabled, mark as verified automatically
          if (!data.is2FAEnabled) {
            setIs2FAVerified(true);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await refreshProfile();
      } else {
        setProfile(null);
        setIs2FAVerified(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setIs2FAVerified(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, profile, is2FAVerified, set2FAVerified: setIs2FAVerified, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
