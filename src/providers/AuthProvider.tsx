import { useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, AuthContextType } from "@/contexts/AuthContext";
import type { User } from "@supabase/supabase-js";
import logger from '@/utils/logger';
import { isInstitutionalEmail, isStudentEmail } from '@/utils/emailValidation';
import { validatePassword } from '@/utils/passwordValidation';
import { syncUserToInventory } from '@/utils/userSync';

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
      if (session?.user) {
        if (isStudentEmail(session.user.email || '')) {
          supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }
        syncUserToInventory(session.user);
      }
      setUser(session?.user ?? null);
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (_event === 'SIGNED_IN' && session?.user) {
            const userEmail = session.user.email || '';

            // Bloqueia contas de Alunos (@sj.g12.br) de fazer login no app Zelote
            if (isStudentEmail(userEmail)) {
              await supabase.auth.signOut();
              localStorage.setItem(
                'zelote_oauth_error',
                'Contas de alunos (@sj.g12.br) não têm permissão de login no sistema. O cadastro de alunos é gerenciado exclusivamente no inventário.'
              );
              setUser(null);
              return;
            }

            // Validação de domínio para logins OAuth (Google)
            const provider = session.user.app_metadata?.provider;
            if (provider === 'google' && !isInstitutionalEmail(userEmail)) {
              await supabase.auth.signOut();
              localStorage.setItem(
                'zelote_oauth_error',
                'Acesso restrito. Use um email institucional (@colegiosaojudas.com.br ou @sj.pro.br).'
              );
              setUser(null);
              return;
            }

            // Sincroniza automaticamente o usuário (Professor/Funcionário) com o inventário
            syncUserToInventory(session.user);
          }
          setUser(session?.user ?? null);
        }
      );
      return () => {
        subscription.unsubscribe();
      };
    });
  }, []);

  const login = async (email: string, password: string) => {
    if (isStudentEmail(email)) {
      return {
        success: false,
        error: "Contas de alunos (@sj.g12.br) não têm permissão de login no sistema. O cadastro de alunos é gerenciado exclusivamente no inventário."
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.user) {
      syncUserToInventory(data.user);
    }
    return { success: !error, error: error?.message || null };
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    if (isStudentEmail(email)) {
      return {
        success: false,
        error: "Contas de alunos (@sj.g12.br) não têm permissão de cadastro no sistema. Alunos são cadastrados exclusivamente no inventário."
      };
    }

    if (!verifyEmail(email)) {
      return { success: false, error: "O registro é permitido apenas com domínios institucionais permitidos (@sj.pro.br ou @colegiosaojudas.com.br)." };
    }

    if (!validatePassword(password).isValid) {
      return { success: false, error: "A senha não atende aos requisitos mínimos de segurança (8+ caracteres, maiúsculas, números e símbolos)." };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (!error && data?.user) {
      syncUserToInventory(data.user);
    }

    return { success: !error, error: error?.message || null };
  };

  const resetPassword = async (email: string) => {
    // Definimos a base URL: se estivermos em produção, garantimos o uso do domínio lovable.
    // Caso contrário, usamos o origin atual (localhost por exemplo).
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? window.location.origin
      : 'https://zelote.lovable.app';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/update-password`,
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