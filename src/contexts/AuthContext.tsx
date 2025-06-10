
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<{
    user: User | null;
    isLoading: boolean;
  }>({
    user: null,
    isLoading: true
  });

  // Função para inicializar autenticação
  const initAuth = React.useCallback(() => {
    try {
      const savedUser = localStorage.getItem('zelote_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setAuthState({ user: parsedUser, isLoading: false });
      } else {
        // Auto-login para desenvolvimento
        const defaultUser: User = {
          id: 'demo-user',
          email: 'arthur.alencar@colegiosaojudas.com.br',
          name: 'Arthur Alencar'
        };
        setAuthState({ user: defaultUser, isLoading: false });
        localStorage.setItem('zelote_user', JSON.stringify(defaultUser));
      }
    } catch (error) {
      console.error('Erro na inicialização:', error);
      setAuthState({ user: null, isLoading: false });
      localStorage.removeItem('zelote_user');
    }
  }, []);

  // Efeito para inicializar apenas uma vez
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = React.useCallback(async (email: string, password: string): Promise<void> => {
    try {
      const newUser: User = {
        id: 'demo-user',
        email: email,
        name: email === 'arthur.alencar@colegiosaojudas.com.br' ? 'Arthur Alencar' : 'Usuário'
      };
      
      setAuthState({ user: newUser, isLoading: false });
      localStorage.setItem('zelote_user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Erro no login:', error);
      throw new Error('Falha no login');
    }
  }, []);

  const logout = React.useCallback(() => {
    setAuthState({ user: null, isLoading: false });
    localStorage.removeItem('zelote_user');
  }, []);

  const contextValue: AuthContextType = React.useMemo(() => ({
    user: authState.user,
    isAuthenticated: !!authState.user,
    isLoading: authState.isLoading,
    login,
    logout
  }), [authState.user, authState.isLoading, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
