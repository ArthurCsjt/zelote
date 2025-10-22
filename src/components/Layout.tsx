import React from 'react';
import { User, LogOut, ArrowLeft, Bell, Settings, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useNavigate } from 'react-router-dom';
import { useProfileRole } from '@/hooks/use-profile-role';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ActivityFeed } from './ActivityFeed';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { cn } from '@/lib/utils';

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
  
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };
  
  // Lógica de toggleTheme removida, pois o tema é fixo em 'light'

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
              
              {/* Botão de Alternância de Tema REMOVIDO */}
              
              {/* Botão de Notificações (Sino) */}
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
              
              {/* Dropdown de Perfil (Email Clicável) */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="h-9 px-3 border-gray-300 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium hidden sm:inline">
                        {user.email?.substring(0, user.email.indexOf('@'))}
                      </span>
                      <span className="text-sm font-medium sm:hidden">
                        Perfil
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="font-bold text-base truncate">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Item Configurações (Apenas para Admin) */}
                    {isAdmin && (
                      <DropdownMenuItem 
                        onClick={() => navigate('/settings')}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4 text-primary" />
                        Configurações
                      </DropdownMenuItem>
                    )}
                    
                    {/* Item Sair (Para todos) */}
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className={cn(
                        "cursor-pointer flex items-center gap-2",
                        isAdmin ? 'text-red-600 focus:text-red-700 focus:bg-red-50' : 'text-red-600 focus:text-red-700 focus:bg-red-50'
                      )}
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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