import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { ref, get, set, serverTimestamp, update } from 'firebase/database';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, firestore } from '../firebase/config';
import { UserProfile, UserRole } from '../types';

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  createUser: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoBase64?: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser && firebaseUser.email) {
        try {
          // Fetch admin config
          const response = await fetch('/admin-config.json');
          if (!response.ok) throw new Error('Failed to load admin configuration.');
          const config = await response.json();
          const adminEmails: string[] = config.admins || [];
          const userRole: UserRole = adminEmails.includes(firebaseUser.email) ? 'admin' : 'seller';
          
          // Fetch user data from RTDB
          const userDbRef = ref(db, `users/${firebaseUser.uid}`);
          const dbSnapshot = await get(userDbRef);
          const dbData = dbSnapshot.exists() ? dbSnapshot.val() : {};

          // Fetch photo from Firestore
          const userFsRef = doc(firestore, 'user_profiles', firebaseUser.uid);
          const fsSnapshot = await getDoc(userFsRef);
          const fsData = fsSnapshot.exists() ? fsSnapshot.data() : {};

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: userRole,
            displayName: dbData.displayName ?? null,
            photoURL: fsData.photoBase64 || null,
          });

        } catch (error) {
            console.error("Error loading user profile:", error);
            setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: 'seller',
                displayName: null,
                photoURL: null,
            });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    await signInWithEmailAndPassword(auth, email, password);
    
    if (rememberMe) {
      localStorage.setItem('quickLoginUser', JSON.stringify({ email, password }));
    } else {
      localStorage.removeItem('quickLoginUser');
    }
  };

  const logout = async () => {
    await signOut(auth);
  };
  
  const register = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    const userRef = ref(db, 'users/' + newUser.uid);
    await set(userRef, {
      email: newUser.email,
      role: 'seller',
      displayName: "",
      createdAt: serverTimestamp(),
    });
  };

  const createUser = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    const userRef = ref(db, 'users/' + newUser.uid);
    await set(userRef, {
      email: newUser.email,
      role: 'seller',
      displayName: "",
      createdAt: serverTimestamp(),
    });
  };

  const updateUserProfile = async (data: { displayName?: string; photoBase64?: string }) => {
    if (!user) throw new Error("User not authenticated");

    const { displayName, photoBase64 } = data;
    const updates: Partial<Pick<UserProfile, 'displayName' | 'photoURL'>> = {};

    if (displayName !== undefined && displayName !== user.displayName) {
        const userDbRef = ref(db, `users/${user.uid}`);
        await update(userDbRef, { displayName });
        updates.displayName = displayName;
    }

    if (photoBase64 !== undefined && photoBase64 !== user.photoURL) {
        const userFsRef = doc(firestore, 'user_profiles', user.uid);
        await setDoc(userFsRef, { photoBase64 });
        updates.photoURL = photoBase64;
    }

    setUser(prevUser => {
        if (!prevUser) return null;
        return { ...prevUser, ...updates };
    });
  };

  const value = {
    user,
    loading,
    login,
    logout,
    createUser,
    register,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};