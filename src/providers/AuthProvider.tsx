import { useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, AuthContextType } from "@/contexts/AuthContext";
import type { User } from "@supabase/supabase-js";
import logger from '@/utils/logger';
import { isInstitutionalEmail } from '@/utils/emailValidation';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para forçar a atualização da sessão
  const refreshSession = useCallback(async () => {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) {
      logger.error('Erro ao atualizar sessão', error);
      // Se falhar, tenta obter a sessão atual
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setUser(currentSession?.user ?? null);
    } else {
      setUser(session?.user ?? null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null);
        }
      );
      return () => {
        subscription.unsubscribe();
      };
    });
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { success: !error, error: error?.message || null };
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const register = async (email: string, password: string) => {
    if (!verifyEmail(email)) {
      return { success: false, error: "O registro é permitido apenas com domínios institucionais permitidos." };
    }
    const { error } = await supabase.auth.signUp({ email, password });
    return { success: !error, error: error?.message || null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    return { success: !error, error: error?.message || null };
  };

  const verifyEmail = (email: string) => isInstitutionalEmail(email);

  const isAuthenticated = !!user;
  const emailValue = user?.email || null;
  const usernameValue = user?.email?.split('@')[0] || null;

  const value: AuthContextType = {
    isAuthenticated,
    username: usernameValue,
    email: emailValue,
    user,
    login,
    loginWithGoogle,
    logout,
    register,
    resetPassword,
    verifyEmail,
  };

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