
import { Button } from "./ui/button";

interface MainMenuProps {
  onNavigate: (route: 'registration' | 'dashboard' | 'loan' | 'return') => void;
}

export function MainMenu({ onNavigate }: MainMenuProps) {
  return (
    <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
      <Button
        variant="outline"
        className="h-32 text-lg font-medium bg-white hover:bg-blue-50 border-2 border-blue-200"
        onClick={() => onNavigate('registration')}
      >
        Cadastro
      </Button>
      <Button
        variant="outline"
        className="h-32 text-lg font-medium bg-white hover:bg-blue-50 border-2 border-blue-200"
        onClick={() => onNavigate('dashboard')}
      >
        Dashboard
      </Button>
      <Button
        variant="outline"
        className="h-32 text-lg font-medium bg-white hover:bg-blue-50 border-2 border-blue-200"
        onClick={() => onNavigate('loan')}
      >
        Retirada
      </Button>
      <Button
        variant="outline"
        className="h-32 text-lg font-medium bg-white hover:bg-blue-50 border-2 border-blue-200"
        onClick={() => onNavigate('return')}
      >
        Devolução
      </Button>
    </div>
  );
}
