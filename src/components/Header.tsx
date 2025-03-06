
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Header() {
  // Obtém as funções e estados do contexto de autenticação
  const { isAuthenticated, username, logout } = useAuth();
  const navigate = useNavigate();

  // Função para lidar com o logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="mb-8 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Sistema de Gestão de Chromebooks
        </h1>
        <p className="text-gray-500">Controle de empréstimos e devoluções</p>
      </div>
      
      {/* Exibe informações do usuário e botão de logout quando autenticado */}
      {isAuthenticated && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Logado como: <strong>{username}</strong>
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      )}
    </header>
  );
}
