
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Header() {
  const { isAuthenticated, username, email, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="mb-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 max-w-[100vw]">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-800 break-words">
            Zelote
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Controle de empréstimos e devoluções
          </p>
        </div>
        
        {isAuthenticated && (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-sm text-gray-600 text-right">
              <div className="font-semibold text-green-700 truncate max-w-[120px] sm:max-w-[160px]">
                {username}
              </div>
              <div className="text-xs truncate max-w-[120px] sm:max-w-[160px]">
                {email}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center gap-2 border-gray-300 hover:bg-gray-100 ml-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
