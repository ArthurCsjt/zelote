import React from 'react';
import { User, LogOut, ArrowLeft, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useNavigate } from 'react-router-dom';
import { useProfileRole } from '@/hooks/use-profile-role';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ActivityFeed } from './ActivityFeed'; // Importando o novo componente

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}
const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  subtitle,
  showBackButton,
  onBack
}) => {
  const {
    user,
    logout
  } = useAuth();
  const {
    theme,
    setTheme
  } = useTheme();
  const navigate = useNavigate();
  const {
    isAdmin
  } = useProfileRole();
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);
  React.useEffect(() => {
    // Check if app is running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInstalled = isStandaloneMode || isInWebAppiOS;
      setIsStandalone(isInstalled);
      if (isInstalled) {
        document.body.classList.add('standalone-mode');
      } else {
        document.body.classList.remove('standalone-mode');
      }
      return isInstalled;
    };
    const isInstalled = checkStandalone();

    // Check if user has dismissed the banner recently
    const dismissedTime = localStorage.getItem('pwa-banner-dismissed');
    const shouldShowBanner = !isInstalled && (!dismissedTime || Date.now() - parseInt(dismissedTime) > 24 * 60 * 60 * 1000); // 24 hours

    if (shouldShowBanner) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Listen for display mode changes
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      if (e.matches) {
        document.body.classList.add('standalone-mode');
      } else {
        document.body.classList.remove('standalone-mode');
      }
    };
    displayModeQuery.addEventListener('change', handleDisplayModeChange);
    return () => displayModeQuery.removeEventListener('change', handleDisplayModeChange);
  }, []);
  const handleInstallBannerDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };
  return (
    <div className={`min-h-screen bg-background text-foreground ${isStandalone ? 'safe-area-top safe-area-bottom safe-area-left safe-area-right' : ''}`}>
      {/* Status Bar Overlay for iOS in standalone mode */}
      {isStandalone && <div className="status-bar-overlay" />}

      {/* Header */}
      <header className={`bg-card/95 backdrop-blur-xl shadow-sm border-b border-border fixed top-0 left-0 right-0 z-50 ${isStandalone ? 'safe-area-top' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <button onClick={onBack} className="p-2 rounded-full hover:bg-accent transition-colors duration-200 touch-manipulation text-inherit">
                  <ArrowLeft className="w-5 h-5 text-muted-foreground rounded-none bg-inherit" />
                </button>
              )}
              <div>
                <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-2xl font-bold text-left">
                  Zelote
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground hidden sm:block">Controle de empréstimos e devoluções</p>
                  <span className="text-xs text-muted-foreground/60 hidden sm:block">v1.0.0</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              
              {/* Informações do Usuário (Email) */}
              <div className="hidden md:flex items-center space-x-2 text-sm bg-accent rounded-full px-3 py-1.5">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground selectable-text">
                  {user?.email?.substring(0, 20)}...
                </span>
              </div>
              
              {/* Botão Configurações (Se for Admin) */}
              {isAdmin && (
                <button onClick={() => navigate('/settings')} className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 bg-accent hover:bg-accent/80 rounded-full px-3 py-1.5 touch-manipulation">
                  <span>Configurações</span>
                </button>
              )}
              
              {/* Botão de Notificações (Sino) - MOVIDO PARA AQUI */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {/* Exemplo de badge de notificação (pode ser ligado a um estado real) */}
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-auto" align="end">
                  <ActivityFeed />
                </PopoverContent>
              </Popover>
              
              {/* Botão Sair */}
              <button onClick={logout} className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 bg-accent hover:bg-accent/80 rounded-full px-3 py-1.5 touch-manipulation">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 no-bounce pt-24 md:pt-28 ${isStandalone ? 'ios-bottom-safe' : ''}`}>
        {children}
      </main>

      {/* Bottom safe area for standalone mode */}
      {isStandalone && <div className="safe-area-bottom h-16 md:h-24" />}
    </div>
  );
};

export default Layout;