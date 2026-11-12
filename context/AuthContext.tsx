import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { AuthResult } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (
    email: string,
    password: string,
    confirmPassword?: string
  ) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getAuthErrorMessage(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection.';
    default:
      return err instanceof Error ? err.message : 'Authentication failed.';
  }
}

export function AuthProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password) {
        return { success: false, error: 'Enter your email and password.' };
      }

      try {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        return { success: true };
      } catch (err) {
        return { success: false, error: getAuthErrorMessage(err) };
      }
    },
    []
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      confirmPassword?: string
    ): Promise<AuthResult> => {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password) {
        return { success: false, error: 'Enter your email and password.' };
      }
      if (password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters.',
        };
      }
      if (confirmPassword !== undefined && password !== confirmPassword) {
        return { success: false, error: 'Passwords do not match.' };
      }

      try {
        await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        return { success: true };
      } catch (err) {
        return { success: false, error: getAuthErrorMessage(err) };
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<AuthResult> => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (err) {
      return { success: false, error: getAuthErrorMessage(err) };
    }
  }, []);

  const contextValue = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
