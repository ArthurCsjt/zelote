
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Interface para o contexto de autenticação
interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  email: string | null; // Adicionando email ao contexto
  login: (username: string, email?: string) => void; // Modificando para aceitar email opcional
  logout: () => void;
}

// Cria o contexto com valor inicial
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  username: null,
  email: null, // Valor inicial para email
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
  const [email, setEmail] = useState<string | null>(null); // Novo estado para email

  // Verifica se o usuário está autenticado ao carregar a página
  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    const storedUsername = localStorage.getItem("username");
    const storedEmail = localStorage.getItem("email"); // Recupera email do localStorage
    
    if (storedAuth === "true" && storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
      setEmail(storedEmail); // Define o email se existir
    }
  }, []);

  // Função para realizar login
  const login = (username: string, email?: string) => {
    setIsAuthenticated(true);
    setUsername(username);
    
    if (email) {
      setEmail(email);
      localStorage.setItem("email", email); // Salva email no localStorage
    }
    
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("username", username);
  };

  // Função para realizar logout
  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    setEmail(null); // Limpa o email ao fazer logout
    
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("email"); // Remove email do localStorage
  };

  // Fornece o contexto para os componentes filhos
  return (
    <AuthContext.Provider value={{ isAuthenticated, username, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
