import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

// Este é o "contrato" do que o nosso contexto de autenticação vai fornecer
export interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  email: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (email: string) => boolean;
  user: User | null;
}

// Criamos o contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Criamos o hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};