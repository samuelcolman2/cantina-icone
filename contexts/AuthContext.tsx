import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { ref, get, set, serverTimestamp } from 'firebase/database';
import { auth, db } from '../firebase/config';
import { UserProfile, UserRole } from '../types';

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  createUser: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
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
          // Fetch the admin configuration file
          const response = await fetch('/admin-config.json');
          if (!response.ok) {
            throw new Error('Failed to load admin configuration.');
          }
          const config = await response.json();
          const adminEmails: string[] = config.admins || [];

          // Determine user role based on the config file
          const userRole: UserRole = adminEmails.includes(firebaseUser.email) ? 'admin' : 'seller';
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: userRole,
          });

        } catch (error) {
            console.error("Error checking admin status, defaulting to 'seller':", error);
            // Fallback to seller role if config is missing or fails to load
            setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: 'seller',
            });
        }
      } else {
        // User is signed out or doesn't have an email
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };
  
  const register = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    // Create an entry for the new user in Realtime Database with a default 'seller' role
    // The actual role will be determined on next login by the config file.
    const userRef = ref(db, 'users/' + newUser.uid);
    await set(userRef, {
      email: newUser.email,
      role: 'seller',
      createdAt: serverTimestamp(),
    });
    // onAuthStateChanged will handle setting the user state, logging them in automatically.
  };

  const createUser = async (email: string, password: string) => {
    // This function is for admins to create users.
    // The role is determined by admin-config.json, not at creation time.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    const userRef = ref(db, 'users/' + newUser.uid);
    await set(userRef, {
      email: newUser.email,
      role: 'seller', // Default role in DB, actual role determined by config on login
      createdAt: serverTimestamp(),
    });

    // To prevent the admin from being logged out, we don't need to do anything special here.
    // Firebase's onAuthStateChanged will keep the current admin's session active.
  };

  const value = {
    user,
    loading,
    login,
    logout,
    createUser,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};