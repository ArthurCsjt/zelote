import React from 'react';
import { User, LogOut, ArrowLeft, Bell, Settings, Sun, Moon, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useNavigate } from 'react-router-dom';
import { useProfileRole } from '@/hooks/use-profile-role';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ActivityFeed } from './ActivityFeed';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';


interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  backgroundClass?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  subtitle,
  showBackButton,
  onBack,
  backgroundClass = 'bg-background'
}) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useProfileRole();
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
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
    checkStandalone();

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

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn(`min-h-screen text-foreground ${isStandalone ? 'safe-area-top safe-area-bottom safe-area-left safe-area-right' : ''}`, backgroundClass)}>

      {/* Status Bar Overlay for iOS in standalone mode */}
      {isStandalone && <div className="status-bar-overlay" />}

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isStandalone ? 'safe-area-top' : ''}`}>
        {/* Glassmorphism Header Background */}
        <div className="absolute inset-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-white/20 dark:border-zinc-800/50 shadow-sm" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 touch-manipulation text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent text-2xl font-bold text-left tracking-tight">
                  Zelote
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground hidden sm:block font-medium">Controle de empréstimos</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold hidden sm:block">v1.0.0</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">

              {/* Botão de Notificações */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-80 sm:w-96 bg-card/95 backdrop-blur-xl border-border shadow-xl rounded-2xl overflow-hidden" align="end">
                  <ActivityFeed />
                </PopoverContent>
              </Popover>

              {/* Botão de Alternância de Tema */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-9 w-9 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-amber-400" />
                ) : (
                  <Moon className="h-5 w-5 text-zinc-600" />
                )}
              </Button>

              {/* Dropdown de Perfil */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "h-9 pl-2 pr-3 rounded-full border border-border/50 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-all duration-300",
                        "hover:shadow-md hover:border-primary/20",
                      )}
                    >
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {roleLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          user.email?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-sm font-medium hidden sm:inline text-foreground/90">
                        {user.email?.split('@')[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 bg-card/95 backdrop-blur-xl border-border shadow-xl rounded-xl p-1">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{role || 'Usuário'}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-border/50" />

                    {role && (role === 'admin' || role === 'super_admin') && (
                      <DropdownMenuItem
                        onClick={() => navigate('/settings')}
                        className="cursor-pointer rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800"
                      >
                        <Settings className="h-4 w-4 mr-2 text-primary" />
                        Configurações
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
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
      <main className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 no-bounce pt-24 md:pt-28 ${isStandalone ? 'ios-bottom-safe' : ''}`}>
        {/* Background Gradient Spot */}
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      {isStandalone && <div className="safe-area-bottom h-16 md:h-24" />}
    </div>
  );
};

export default Layout;