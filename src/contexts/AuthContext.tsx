import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

// A interface para o que o contexto fornece (mantida igual)
interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  email: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>; // Removido newPassword que não era usado
  verifyEmail: (email: string) => boolean;
  user: User | null;
}

// O contexto (mantido igual)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// O hook para usar o contexto (mantido igual)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// O Provedor de Autenticação (CORRIGIDO)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Começa como true

  // --- CORREÇÃO PRINCIPAL AQUI ---
  // O useEffect foi simplificado para evitar "condições de corrida" no deploy.
  useEffect(() => {
    // 1. Pega a sessão inicial para saber se o usuário já está logado.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false); // Termina o carregamento inicial

      // 2. Ouve por futuras mudanças (login, logout).
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null);
        }
      );

      // 3. Limpa o listener quando o componente é desmontado.
      return () => {
        subscription.unsubscribe();
      };
    });
  }, []);

  // Funções de login, logout, etc. (mantidas com pequenas melhorias)
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { success: !error, error: error?.message };
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const register = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { success: !error, error: error?.message };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { success: !error, error: error?.message };
  };

  const verifyEmail = (email: string) => /@colegiosaojudas\.com\.br$/i.test(email);

  // Deriva outros estados a partir do 'user' para simplicidade
  const isAuthenticated = !!user;
  const email = user?.email || null;
  const username = user?.email?.split('@')[0] || null;

  // O valor que será fornecido para toda a aplicação
  const value = {
    isAuthenticated,
    username,
    email,
    user,
    login,
    loginWithGoogle,
    logout,
    register,
    resetPassword,
    verifyEmail,
  };

  // Enquanto carrega a sessão inicial, mostra uma tela de loading.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando Sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};