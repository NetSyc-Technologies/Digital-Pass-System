'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StaffRole, Coordinator } from '@/types';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase/config';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { dataService } from '@/lib/services/dataService';

export const SUPER_ADMIN_EMAIL = 'bhushanmallick2006@gmail.com';

export interface AuthStaffUser {
  uid: string;
  email: string;
  fullName: string;
  role: StaffRole;
  isActive: boolean;
  isSuperAdmin: boolean;
  photoURL?: string | null;
}

interface AuthContextType {
  user: AuthStaffUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<boolean>;
  signInAsDemoRole: (role: StaffRole, customEmail?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  hasRole: (allowedRoles: StaffRole[]) => boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthStaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to resolve role and coordinator profile for an email
  const resolveStaffUser = async (email: string, uid: string, displayName?: string | null, photoURL?: string | null): Promise<AuthStaffUser | null> => {
    const cleanEmail = email.trim().toLowerCase();
    const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();

    // Super Admin gets instant unconditional access
    if (isSuperAdmin) {
      return {
        uid,
        email: cleanEmail,
        fullName: displayName || 'Bhushan Mallick (Super Admin)',
        role: 'super_admin',
        isActive: true,
        isSuperAdmin: true,
        photoURL,
      };
    }

    // Lookup in coordinators registry
    const coordinators = await dataService.getCoordinators();
    const found = coordinators.find((c) => c.email.trim().toLowerCase() === cleanEmail);

    if (!found) {
      return null;
    }

    if (!found.isActive) {
      throw new Error('Your staff coordinator account has been deactivated by the Administrator.');
    }

    // Update last login timestamp in background
    dataService.updateCoordinator(found.id, { lastLogin: new Date().toISOString() }, cleanEmail);

    return {
      uid,
      email: cleanEmail,
      fullName: found.fullName || displayName || cleanEmail,
      role: found.role,
      isActive: found.isActive,
      isSuperAdmin: false,
      photoURL,
    };
  };

  useEffect(() => {
    // Check saved demo user in localStorage first
    const savedDemoUser = typeof window !== 'undefined' ? localStorage.getItem('tgpcet_staff_auth') : null;
    if (savedDemoUser) {
      try {
        const parsed = JSON.parse(savedDemoUser);
        setUser(parsed);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('tgpcet_staff_auth');
      }
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
        if (firebaseUser && firebaseUser.email) {
          try {
            const staffUser = await resolveStaffUser(
              firebaseUser.email,
              firebaseUser.uid,
              firebaseUser.displayName,
              firebaseUser.photoURL
            );

            if (staffUser) {
              setUser(staffUser);
              setError(null);
            } else {
              setError(`Access Denied: ${firebaseUser.email} is not an authorized coordinator.`);
              setUser(null);
            }
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Authentication verification error.');
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async (): Promise<boolean> => {
    setError(null);
    setLoading(true);

    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user && result.user.email) {
          const staffUser = await resolveStaffUser(
            result.user.email,
            result.user.uid,
            result.user.displayName,
            result.user.photoURL
          );

          if (!staffUser) {
            setError(`Account ${result.user.email} is not registered as a coordinator. Contact Super Admin.`);
            await firebaseSignOut(auth);
            setLoading(false);
            return false;
          }

          setUser(staffUser);
          setLoading(false);
          return true;
        }
      } catch (err: unknown) {
        console.error('Firebase Google Sign-In error:', err);
        setError(err instanceof Error ? err.message : 'Google Sign-In failed.');
        setLoading(false);
        return false;
      }
    } else {
      // In local/mock mode without active Firebase keys, simulate Super Admin login
      const staffUser: AuthStaffUser = {
        uid: 'user_super_admin',
        email: SUPER_ADMIN_EMAIL,
        fullName: 'Bhushan Mallick (Super Admin)',
        role: 'super_admin',
        isActive: true,
        isSuperAdmin: true,
      };
      setUser(staffUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('tgpcet_staff_auth', JSON.stringify(staffUser));
      }
      setLoading(false);
      return true;
    }
    setLoading(false);
    return false;
  };

  const signInAsDemoRole = async (role: StaffRole, customEmail?: string): Promise<boolean> => {
    setError(null);
    setLoading(true);

    let demoUser: AuthStaffUser;

    if (role === 'super_admin' || role === 'admin') {
      demoUser = {
        uid: 'demo_super_admin',
        email: SUPER_ADMIN_EMAIL,
        fullName: 'Bhushan Mallick (Super Admin)',
        role: 'super_admin',
        isActive: true,
        isSuperAdmin: true,
      };
    } else if (role === 'gate_coordinator') {
      demoUser = {
        uid: 'demo_gate_coord',
        email: customEmail || 'gate.coordinator@tgpcet.edu',
        fullName: 'Rohan Sharma (Gate Lead)',
        role: 'gate_coordinator',
        isActive: true,
        isSuperAdmin: false,
      };
    } else {
      demoUser = {
        uid: 'demo_payment_coord',
        email: customEmail || 'payment.team@tgpcet.edu',
        fullName: 'Priya Verma (Finance Coordinator)',
        role: 'payment_coordinator',
        isActive: true,
        isSuperAdmin: false,
      };
    }

    setUser(demoUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tgpcet_staff_auth', JSON.stringify(demoUser));
    }
    setLoading(false);
    return true;
  };

  const signOut = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.warn('SignOut warning:', e);
      }
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tgpcet_staff_auth');
    }
  };

  const hasRole = (allowedRoles: StaffRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (user.role === 'admin' && !allowedRoles.includes('super_admin')) return true;
    return allowedRoles.includes(user.role);
  };

  const refreshUserData = async () => {
    if (!user) return;
    try {
      const refreshed = await resolveStaffUser(user.email, user.uid, user.fullName, user.photoURL);
      if (refreshed) {
        setUser(refreshed);
        if (typeof window !== 'undefined') {
          localStorage.setItem('tgpcet_staff_auth', JSON.stringify(refreshed));
        }
      }
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle,
        signInAsDemoRole,
        signOut,
        hasRole,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
