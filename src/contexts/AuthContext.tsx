
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Interface para o tipo de usuário
interface User {
  username: string;
  email: string;
  password: string;
}

// Interface para o contexto de autenticação
interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  email: string | null;
  // Funções de autenticação
  login: (username: string, email: string, password: string) => boolean;
  logout: () => void;
  // Funções de gerenciamento de usuário
  register: (username: string, email: string, password: string) => boolean;
  resetPassword: (email: string, newPassword: string) => boolean;
  // Verificação de email
  verifyEmail: (email: string) => boolean;
}

// Cria o contexto com valor inicial
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  username: null,
  email: null,
  login: () => false,
  logout: () => {},
  register: () => false,
  resetPassword: () => false,
  verifyEmail: () => false,
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
  const [email, setEmail] = useState<string | null>(null);
  // Estado para armazenar os usuários registrados (em um sistema real, isso estaria em um banco de dados)
  const [users, setUsers] = useState<User[]>([]);

  // Verifica se o domínio do email é válido
  const validateEmailDomain = (email: string): boolean => {
    const domainRegex = /@colegiosaojudas\.com\.br$/i;
    return domainRegex.test(email);
  };

  // Carrega usuários e autenticação do localStorage ao iniciar
  useEffect(() => {
    // Carrega usuários
    const storedUsers = localStorage.getItem("users");
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // Cria um usuário padrão se não existir nenhum
      const defaultUser = {
        username: "admin",
        email: "admin@colegiosaojudas.com.br",
        password: "admin123"
      };
      setUsers([defaultUser]);
      localStorage.setItem("users", JSON.stringify([defaultUser]));
    }

    // Verifica autenticação
    const storedAuth = localStorage.getItem("isAuthenticated");
    const storedUsername = localStorage.getItem("username");
    const storedEmail = localStorage.getItem("email");
    
    if (storedAuth === "true" && storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
      if (storedEmail) setEmail(storedEmail);
    }
  }, []);

  // Salva usuários no localStorage quando a lista é atualizada
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem("users", JSON.stringify(users));
    }
  }, [users]);

  // Função para verificar se um email existe
  const verifyEmail = (email: string): boolean => {
    if (!validateEmailDomain(email)) return false;
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
  };

  // Função para registrar um novo usuário
  const register = (username: string, email: string, password: string): boolean => {
    // Verifica se o email tem o domínio correto
    if (!validateEmailDomain(email)) {
      return false;
    }

    // Verifica se o email já está registrado
    if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
      return false;
    }

    // Cria um novo usuário
    const newUser = { username, email, password };
    setUsers(prevUsers => [...prevUsers, newUser]);
    
    return true;
  };

  // Função para redefinir a senha
  const resetPassword = (email: string, newPassword: string): boolean => {
    // Verifica se o email existe
    const userIndex = users.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
    if (userIndex === -1) {
      return false;
    }

    // Atualiza a senha do usuário
    const updatedUsers = [...users];
    updatedUsers[userIndex] = { 
      ...updatedUsers[userIndex], 
      password: newPassword 
    };
    
    setUsers(updatedUsers);
    return true;
  };

  // Função para realizar login
  const login = (username: string, email: string, password: string): boolean => {
    // Verifica se o usuário existe e a senha está correta
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (user) {
      setIsAuthenticated(true);
      setUsername(user.username);
      setEmail(user.email);
      
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", user.username);
      localStorage.setItem("email", user.email);
      
      return true;
    }
    
    return false;
  };

  // Função para realizar logout
  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    setEmail(null);
    
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
  };

  // Fornece o contexto para os componentes filhos
  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      username, 
      email, 
      login, 
      logout, 
      register, 
      resetPassword,
      verifyEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};
