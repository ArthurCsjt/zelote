
import { Button } from "./ui/button";
import { Computer, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { Badge } from "./ui/badge";

interface MainMenuProps {
  onNavigate: (route: 'registration' | 'dashboard' | 'loan' | 'return') => void;
}

export function MainMenu({ onNavigate }: MainMenuProps) {
  return (
    <div className="max-w-4xl mx-auto mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <Button
          variant="outline"
          className="h-40 flex flex-col items-center justify-center gap-3 text-lg font-medium glass-card hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all fade-enter"
          onClick={() => onNavigate('registration')}
        >
          <Computer className="h-8 w-8 text-blue-500" />
          <span>Cadastro</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-40 flex flex-col items-center justify-center gap-3 text-lg font-medium glass-card hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all fade-enter"
          onClick={() => onNavigate('dashboard')}
        >
          <LayoutDashboard className="h-8 w-8 text-blue-500" />
          <span>Dashboard</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-40 flex flex-col items-center justify-center gap-3 text-lg font-medium glass-card hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all fade-enter"
          onClick={() => onNavigate('loan')}
        >
          <LogOut className="h-8 w-8 text-blue-500" />
          <span>Retirada</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-40 flex flex-col items-center justify-center gap-3 text-lg font-medium glass-card hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all fade-enter"
          onClick={() => onNavigate('return')}
        >
          <LogIn className="h-8 w-8 text-blue-500" />
          <span>Devolução</span>
        </Button>
      </div>
    </div>
  );
}
