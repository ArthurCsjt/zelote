
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

export const useAuth = (): AuthContextType => {
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular inicialização de autenticação
    const initAuth = () => {
      try {
        const savedUser = localStorage.getItem('zelote_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } else {
          // Auto-login para desenvolvimento
          const defaultUser: User = {
            id: 'demo-user',
            email: 'arthur.alencar@colegiosaojudas.com.br',
            name: 'Arthur Alencar'
          };
          setUser(defaultUser);
          localStorage.setItem('zelote_user', JSON.stringify(defaultUser));
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
        setUser(null);
        localStorage.removeItem('zelote_user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const newUser: User = {
        id: 'demo-user',
        email: email,
        name: email === 'arthur.alencar@colegiosaojudas.com.br' ? 'Arthur Alencar' : 'Usuário'
      };
      
      setUser(newUser);
      localStorage.setItem('zelote_user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Erro no login:', error);
      throw new Error('Falha no login');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('zelote_user');
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
