
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Interface para o contexto de autenticação
interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
}

// Cria o contexto com valor inicial
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  username: null,
  login: () => {},
  logout: () => {},
});

// Hook personalizado para acessar o contexto de autenticação
export const useAuth = () => useContext(AuthContext);

// Provedor do contexto de autenticação
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Estados para controlar a autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  // Verifica se o usuário está autenticado ao carregar a página
  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    const storedUsername = localStorage.getItem("username");
    
    if (storedAuth === "true" && storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
    }
  }, []);

  // Função para realizar login
  const login = (username: string) => {
    setIsAuthenticated(true);
    setUsername(username);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("username", username);
  };

  // Função para realizar logout
  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
  };

  // Fornece o contexto para os componentes filhos
  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
