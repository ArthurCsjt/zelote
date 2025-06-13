
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

// Interface para o contexto de autenticação
interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  email: string | null;
  // Funções de autenticação
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  // Funções de gerenciamento de usuário
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  // Verificação de email
  verifyEmail: (email: string) => boolean;
  user: User | null;
}

// Cria o contexto com valor inicial
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  username: null,
  email: null,
  login: async () => ({ success: false }),
  loginWithGoogle: async () => {},
  logout: async () => {},
  register: async () => ({ success: false }),
  resetPassword: async () => ({ success: false }),
  verifyEmail: () => false,
  user: null,
});

// Hook personalizado para acessar o contexto de autenticação
export const useAuth = () => useContext(AuthContext);

// Provedor do contexto de autenticação
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Verifica se o domínio do email é válido
  const validateEmailDomain = (email: string): boolean => {
    const domainRegex = /@colegiosaojudas\.com\.br$/i;
    return domainRegex.test(email);
  };

  // Verifica a sessão do usuário ao iniciar e configura um listener para mudanças na autenticação
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      if (session?.user) {
        setEmail(session.user.email);
        setUsername(session.user.email?.split('@')[0] || null);
      } else {
        setEmail(null);
        setUsername(null);
      }
    });

    // THEN check for existing session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          setUser(session.user);
          setIsAuthenticated(true);
          setEmail(session.user.email);
          setUsername(session.user.email?.split('@')[0] || null);
        }
      } catch (error) {
        console.error("Error initializing session:", error);
      }
    };

    initSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função para verificar se um email existe
  const verifyEmail = (email: string): boolean => {
    if (!validateEmailDomain(email)) return false;
    return true; // Em Supabase, verificamos isso de outra forma
  };

  // Função para registrar um novo usuário
  const register = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Verifica se o email tem o domínio correto
    if (!validateEmailDomain(email)) {
      return { 
        success: false, 
        error: "O email deve ter o domínio @colegiosaojudas.com.br" 
      };
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Função para redefinir a senha
  const resetPassword = async (email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Envia um email de redefinição de senha
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Função para realizar login
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Função para login com Google
  const loginWithGoogle = async (): Promise<void> => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      }
    });
  };

  // Função para realizar logout
  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  // Fornece o contexto para os componentes filhos
  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      username, 
      email, 
      login, 
      loginWithGoogle,
      logout, 
      register, 
      resetPassword,
      verifyEmail,
      user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
