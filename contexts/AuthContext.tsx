import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { ref, get, set, serverTimestamp, update } from 'firebase/database';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firestore } from '../firebase/config';
import { UserProfile } from '../types';

// ===================================
// HELPERS & CONFIG
// ===================================

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyqmPyYR6D7eZjreva31DPo9o82zFbKrcBguLms51bzJgcNMI2oqeO4WDwR-oGU4_dJ/exec';

const sanitizeEmail = (email: string): string => {
  return email.replace(/\./g, ',').replace(/[#$[\]]/g, '_');
};

const sha256client = async (str: string): Promise<string> => {
  const textAsBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', textAsBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};


// ===================================
// CONTEXT DEFINITION
// ===================================

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoBase64?: string }) => Promise<void>;
  requestPasswordResetCode: (email: string) => Promise<{ ok: boolean; msg: string }>;
  confirmPasswordResetWithCode: (email: string, code: string, newPassword: string) => Promise<{ ok: boolean; msg: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const sessionUserJson = sessionStorage.getItem('authUser');
      const localUserJson = localStorage.getItem('authUser');
      const userJson = sessionUserJson || localUserJson;

      if (userJson) {
        setUser(JSON.parse(userJson));
      }
    } catch (error) {
      console.error("Failed to parse user from storage", error);
      sessionStorage.removeItem('authUser');
      localStorage.removeItem('authUser');
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const sanitizedEmail = sanitizeEmail(email);
    const passwordHash = await sha256client(password);

    const userRef = ref(db, `users/${sanitizedEmail}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists() || snapshot.val().passwordHash !== passwordHash) {
      throw new Error("Invalid credentials");
    }

    const dbData = snapshot.val();
    
    const userFsRef = doc(firestore, 'user_profiles', sanitizedEmail);
    const fsSnapshot = await getDoc(userFsRef);
    const fsData = fsSnapshot.exists() ? fsSnapshot.data() : {};

    const userProfile: UserProfile = {
      uid: sanitizedEmail,
      email: dbData.email,
      role: dbData.role || 'seller',
      displayName: dbData.displayName || null,
      photoURL: fsData.photoBase64 || null,
    };

    setUser(userProfile);

    // Clear both storages first for a clean state
    sessionStorage.removeItem('authUser');
    localStorage.removeItem('authUser');

    if (rememberMe) {
        localStorage.setItem('authUser', JSON.stringify(userProfile));
    } else {
        sessionStorage.setItem('authUser', JSON.stringify(userProfile));
    }

    // Manage quick login users list in localStorage
    try {
        const quickLoginUsersJson = localStorage.getItem('quickLoginUsers');
        let quickLoginUsers = quickLoginUsersJson ? JSON.parse(quickLoginUsersJson) : [];
        if (!Array.isArray(quickLoginUsers)) quickLoginUsers = []; // Ensure it's an array

        const userIndex = quickLoginUsers.findIndex((u: any) => u.email === userProfile.email);

        if (rememberMe) {
            const newQuickLoginUser = {
                email: userProfile.email,
                password: password,
                photoURL: userProfile.photoURL,
            };
            
            if (userIndex > -1) {
                quickLoginUsers[userIndex] = newQuickLoginUser;
            } else {
                quickLoginUsers.push(newQuickLoginUser);
            }
        } else {
            // If not "remember me", remove from quick login list if they exist
            if (userIndex > -1) {
                quickLoginUsers.splice(userIndex, 1);
            }
        }
        
        localStorage.setItem('quickLoginUsers', JSON.stringify(quickLoginUsers));
        localStorage.removeItem('quickLoginUser'); // Cleanup old key
    } catch (error) {
        console.error("Failed to manage quick login users in localStorage", error);
    }
  };

  const logout = async () => {
    setUser(null);
    sessionStorage.removeItem('authUser');
    localStorage.removeItem('authUser');
  };
  
  const register = async (email: string, password: string) => {
    const sanitizedEmail = sanitizeEmail(email);
    
    const userRef = ref(db, 'users/' + sanitizedEmail);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      throw new Error('Email already in use');
    }

    const passwordHash = await sha256client(password);
    
    await set(userRef, {
      email: email,
      role: 'seller',
      displayName: email.split('@')[0],
      createdAt: serverTimestamp(),
      passwordHash: passwordHash
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
    if (photoBase64 !== undefined) {
        const userFsRef = doc(firestore, 'user_profiles', user.uid);
        await setDoc(userFsRef, { photoBase64 }, { merge: true });
        updates.photoURL = photoBase64;
    }
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);

    if (sessionStorage.getItem('authUser')) {
        sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
    }
    if (localStorage.getItem('authUser')) {
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
    }
  };

  const requestPasswordResetCode = async (email: string) => {
    try {
        const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=requestReset&email=${encodeURIComponent(email)}`);
        if (!response.ok) throw new Error("Network response was not ok.");
        return await response.json();
    } catch (error) {
        console.error("Error requesting password reset code:", error);
        return { ok: false, msg: "Erro de comunicação com o servidor. Tente novamente." };
    }
  };

  const confirmPasswordResetWithCode = async (email: string, code: string, newPassword: string) => {
    try {
        const url = `${GOOGLE_APPS_SCRIPT_URL}?action=confirmReset&email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&newPassword=${encodeURIComponent(newPassword)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok.");
        return await response.json();
    } catch (error) {
        console.error("Error confirming password reset:", error);
        return { ok: false, msg: "Erro de comunicação com o servidor. Tente novamente." };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    updateUserProfile,
    requestPasswordResetCode,
    confirmPasswordResetWithCode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};