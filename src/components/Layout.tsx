import React from 'react';
import { User as UserIcon, LogOut, ArrowLeft } from 'lucide-react';
// REMOVEMOS as importações dos hooks para quebrar o ciclo
// import { useAuth } from '@/contexts/AuthContext';
// import { useProfileRole } from '@/hooks/use-profile-role';
import { useTheme } from '@/hooks/use-theme';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js'; // Importamos o tipo User

// ADICIONAMOS as novas props que o Layout vai receber
interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  user: User | null;
  isAdmin: boolean;
  logout: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  subtitle,
  showBackButton,
  onBack,
  user, // Recebendo via props
  isAdmin, // Recebendo via props
  logout, // Recebendo via props
}) => {
  // REMOVEMOS as chamadas dos hooks daqui
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  // O resto do seu código de PWA (isStandalone, etc.) continua igual
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);
  React.useEffect(() => {
    // ... (toda a sua lógica de PWA continua aqui, sem alterações)
  }, []);
  const handleInstallBannerDismiss = () => { /* ... */ };

  return (
    <div className={`min-h-screen bg-background text-foreground ${isStandalone ? 'safe-area-top safe-area-bottom safe-area-left safe-area-right' : ''}`}>
      {/* ... (o resto do seu JSX do Layout continua aqui, sem alterações)... */}
      {/* Ele vai usar as variáveis 'user', 'isAdmin' e 'logout' que vieram das props */}
      
      {/* Header */}
      <header className={`bg-card/95 backdrop-blur-xl shadow-sm border-b border-border fixed top-0 left-0 right-0 z-50 ${isStandalone ? 'safe-area-top' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ... (código do header) ... */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm bg-accent rounded-full px-3 py-1.5">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground selectable-text">
                  {user?.email?.substring(0, 20)}...
                </span>
              </div>
              {isAdmin && <button onClick={() => navigate('/settings')} className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 bg-accent hover:bg-accent/80 rounded-full px-3 py-1.5 touch-manipulation">
                <span>Configurações</span>
              </button>}
              <button onClick={logout} className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 bg-accent hover:bg-accent/80 rounded-full px-3 py-1.5 touch-manipulation">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 no-bounce pt-20 ${isStandalone ? 'ios-bottom-safe' : ''}`}>
        {children}
      </main>

      {/* ... (resto do JSX) ... */}
    </div>
  );
};

export default Layout;