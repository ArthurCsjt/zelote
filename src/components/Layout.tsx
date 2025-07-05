import React from 'react';
import { User, LogOut, ArrowLeft, Download, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, showBackButton, onBack }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
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
    const shouldShowBanner = !isInstalled && (!dismissedTime || 
      (Date.now() - parseInt(dismissedTime)) > 24 * 60 * 60 * 1000); // 24 hours

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
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 ${isStandalone ? 'safe-area-top safe-area-bottom safe-area-left safe-area-right' : ''}`}>
      {/* Status Bar Overlay for iOS in standalone mode */}
      {isStandalone && (
        <div className="status-bar-overlay" />
      )}

      {/* PWA Install Banner - only show in browser mode */}
      {showInstallBanner && !isStandalone && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 text-center relative animate-slide-up">
          <div className="flex items-center justify-center gap-3">
            <Download className="w-5 h-5" />
            <span className="text-sm font-medium">
              📱 Instale o Zelote para acesso rápido
            </span>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={handleInstallBannerDismiss}
              className="text-white hover:text-gray-200 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 sticky top-0 z-40 ${isStandalone ? 'safe-area-top' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 touch-manipulation"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Zelote
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">Controle de empréstimos e devoluções</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 touch-manipulation"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              <div className="hidden md:flex items-center space-x-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-full px-3 py-1.5">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300 selectable-text">
                  {user?.email?.substring(0, 20)}...
                </span>
              </div>
              <button 
                onClick={logout}
                className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full px-3 py-1.5 touch-manipulation"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 no-bounce ${isStandalone ? 'ios-bottom-safe' : ''}`}>
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-center text-gray-600 max-w-2xl mx-auto text-sm sm:text-base px-4 selectable-text">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </main>

      {/* Bottom safe area for standalone mode */}
      {isStandalone && (
        <div className="safe-area-bottom" />
      )}
    </div>
  );
};

export default Layout;