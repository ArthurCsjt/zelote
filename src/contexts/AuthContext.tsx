import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

export interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  email: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null; }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  // register: (email: string, password: string) => Promise<{ success: boolean; error: string | null; }>; // Removido
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null; }>;
  verifyEmail: (email: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};