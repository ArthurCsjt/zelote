import React from 'react';
import { User, LogOut, ArrowLeft, Bell, Settings, Sun, Moon, Loader2, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useNavigate } from 'react-router-dom';
import { useProfileRole } from '@/hooks/use-profile-role';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ActivityFeed } from './ActivityFeed';
import { NotificationFeed } from './NotificationFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDatabase } from '@/hooks/useDatabase';
import { useQuery } from '@tanstack/react-query';
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
  const { getNotifications } = useDatabase();
  const [isStandalone, setIsStandalone] = React.useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

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
      <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300 no-print", isStandalone ? 'safe-area-top' : '')}>
        {/* Neo-Brutalism Header Background */}
        <div className="absolute inset-0 bg-primary overflow-hidden">
          {/* Dots Pattern Overlay */}
          <div className="absolute inset-0 neo-brutal-dots opacity-20" />
          {/* Bottom Gradient Border */}
          <div className="absolute bottom-0 w-full h-2 bg-gradient-to-r from-primary via-warning to-success" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-none border-2 border-transparent hover:border-white hover:bg-white/10 transition-all duration-200 touch-manipulation text-primary-foreground shadow-none hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:shadow-none translate-x-0 hover:translate-x-[-1px] hover:translate-y-[-1px]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo-header.svg"
                    alt="Zelote"
                    className="h-8 sm:h-10 w-auto object-contain neo-brutal-logo"
                  />
                  <span className="text-[10px] px-1.5 py-0.5 text-white font-bold hidden sm:block glass-badge rounded-sm self-start mt-1">v1.0.0</span>
                </div>
                <p className="text-[10px] font-bold text-white/90 hidden sm:block uppercase tracking-[0.2em] mt-1 opacity-80">
                  Controle de Empréstimos
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">

              {/* Botão de Notificações */}
              {!user?.email?.endsWith('@sj.pro.br') && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-white/10 text-white hover:text-white transition-colors">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-4 min-w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black border-2 border-primary animate-in zoom-in px-1">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0 w-80 sm:w-96 bg-card/95 backdrop-blur-xl border-border shadow-xl rounded-xl overflow-hidden"
                    align="end"
                  >
                    <Tabs defaultValue="notifications" className="w-full">
                      <TabsList className="w-full rounded-none bg-muted/50 p-0 h-10 border-b-2 border-black/10 dark:border-white/10">
                        <TabsTrigger value="notifications" className="flex-1 rounded-none data-[state=active]:bg-blue-500 data-[state=active]:text-white uppercase font-black text-[10px] tracking-widest gap-2">
                          <Bell className="h-3 w-3" />
                          Notificações
                          {unreadCount > 0 && (
                            <span className="bg-white text-blue-600 px-1 rounded-sm text-[8px]">{unreadCount}</span>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="flex-1 rounded-none data-[state=active]:bg-yellow-400 data-[state=active]:text-black uppercase font-black text-[10px] tracking-widest gap-2">
                          <Activity className="h-3 w-3" />
                          Atividade
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="notifications" className="m-0 border-none outline-none">
                        <NotificationFeed />
                      </TabsContent>
                      <TabsContent value="activity" className="m-0 border-none outline-none">
                        <ActivityFeed />
                      </TabsContent>
                    </Tabs>
                  </PopoverContent>
                </Popover>
              )}

              {/* Botão de Alternância de Tema */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-9 w-9 rounded-full hover:bg-white/10 text-white hover:text-white transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              {/* Dropdown de Perfil */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "h-9 pl-1 pr-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center gap-2 transition-all duration-300 ml-2",
                        "text-white hover:text-white hover:border-white/40",
                      )}
                    >
                      <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/20">
                        {roleLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          user.email?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-sm font-medium hidden sm:inline text-white/90">
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
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none no-print" />

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      {isStandalone && <div className="safe-area-bottom h-16 md:h-24 no-print" />}
    </div>
  );
};

export default Layout;