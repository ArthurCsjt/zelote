
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Adicionar console.log para debug
  console.log('AuthProvider: Inicializando componente');
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: useEffect executado');
    
    // Simular verificação de autenticação
    const checkAuth = () => {
      try {
        console.log('AuthProvider: Verificando autenticação no localStorage');
        const savedUser = localStorage.getItem('zelote_user');
        if (savedUser) {
          console.log('AuthProvider: Usuário encontrado no localStorage');
          setUser(JSON.parse(savedUser));
        } else {
          console.log('AuthProvider: Nenhum usuário no localStorage, criando usuário padrão');
          // Para desenvolvimento, vamos auto-autenticar
          const defaultUser = {
            id: 'demo-user',
            email: 'arthur.alencar@colegiosaojudas.com.br',
            name: 'Arthur Alencar'
          };
          setUser(defaultUser);
          localStorage.setItem('zelote_user', JSON.stringify(defaultUser));
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        // Em caso de erro, vamos auto-autenticar para desenvolvimento
        const defaultUser = {
          id: 'demo-user',
          email: 'arthur.alencar@colegiosaojudas.com.br',
          name: 'Arthur Alencar'
        };
        setUser(defaultUser);
        localStorage.setItem('zelote_user', JSON.stringify(defaultUser));
      } finally {
        setIsLoading(false);
        console.log('AuthProvider: Loading finalizado');
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Tentativa de login para:', email);
      // Simular login - aceitar qualquer email/senha para desenvolvimento
      const user = {
        id: 'demo-user',
        email: email,
        name: email === 'arthur.alencar@colegiosaojudas.com.br' ? 'Arthur Alencar' : 'Usuário'
      };
      setUser(user);
      localStorage.setItem('zelote_user', JSON.stringify(user));
      console.log('AuthProvider: Login realizado com sucesso');
    } catch (error) {
      console.error('Erro no login:', error);
      throw new Error('Falha no login');
    }
  };

  const logout = () => {
    console.log('AuthProvider: Realizando logout');
    setUser(null);
    localStorage.removeItem('zelote_user');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  console.log('AuthProvider: Renderizando com estado:', { isAuthenticated: !!user, isLoading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
