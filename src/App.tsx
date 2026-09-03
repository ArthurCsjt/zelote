import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from 'sonner';

import { AuthProvider } from "./providers/AuthProvider";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./hooks/use-theme";

import { PrintProvider } from './contexts/PrintContext';
import { AuditProvider } from './providers/AuditProvider';
import logger from "@/utils/logger";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingSpinner } from "./components/ui/loading-spinner";
import Layout from "./components/Layout";

import { supabase } from "./integrations/supabase/client";
import { cn } from "./lib/utils";
import { PWAUpdater } from "./components/PWAUpdater";
import { PWAInstallProvider } from "./contexts/PWAInstallContext";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { PWAInstallGuideModal } from "./components/PWAInstallGuideModal";

// Code-splitting via React.lazy para carregamento sob demanda ultrarrápido
const Index = React.lazy(() => import("./pages/Index"));
const Login = React.lazy(() => import("./pages/Login"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Settings = React.lazy(() => import("./pages/Settings"));
const PrintPreviewPage = React.lazy(() => import("./pages/PrintPreviewPage").then(m => ({ default: m.PrintPreviewPage })));
const SchedulingPage = React.lazy(() => import("./pages/SchedulingPage"));
const UpdatePasswordPage = React.lazy(() => import("./pages/UpdatePassword"));
const AuthCallback = React.lazy(() => import("./pages/AuthCallback"));

// Fallback visual leve durante o carregamento de novas rotas
const PageLoadingFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-8">
    <LoadingSpinner size="lg" className="border-blue-600 border-t-transparent" />
    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Carregando página...</span>
  </div>
);

// Cache Inteligente do TanStack Query: evita refetches excessivos em mobile
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos de dados considerados frescos
      gcTime: 1000 * 60 * 10,   // 10 minutos de retenção em memória
      refetchOnWindowFocus: false, // Não re-dispara requisições ao alternar abas no celular
      retry: 1,
    },
  },
});

/**
 * Componente que escuta eventos globais de autenticação e hash da URL
 * para lidar com convites e recuperação de senha.
 */
const AuthRedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Escuta eventos do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        logger.info("Evento de recuperação de senha detectado via Auth State Change.");
        navigate('/update-password', { replace: true });
      }
    });

    // 2. Checa o hash da URL (casos de invite ou recovery que caem em rotas aleatórias)
    const params = new URLSearchParams(location.hash.substring(1));
    const type = params.get('type');
    const accessToken = params.get('access_token');

    if (type === 'recovery' || type === 'invite') {
      if (accessToken) {
        logger.info(`Tipo ${type} detectado no hash da URL. Redirecionando para /update-password.`);
        navigate(`/update-password${location.hash}`, { replace: true });
      }
    }

    return () => subscription.unsubscribe();
  }, [navigate, location.hash]);

  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // Envolve todas as rotas protegidas com o AuditProvider
  return <AuditProvider>{children}</AuditProvider>;
};

// Componente Wrapper para o Toaster
const ToasterWrapper = () => {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      expand={false}
      duration={4000}
    />
  );
};


const App = () => {
  useEffect(() => {
    logger.info("Application mounted");
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PWAInstallProvider>
            {/* REMOVIDO: DatabaseProvider - usar useDatabase hook diretamente nos componentes */}
            <PrintProvider>
              <BrowserRouter>
                <AuthRedirectHandler />
                <PWAUpdater />
                <PWAInstallPrompt />
                <PWAInstallGuideModal />
                <React.Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* ROTA DE CALLBACK DO OAUTH (Google, etc.) */}
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    <Route path="/update-password" element={<UpdatePasswordPage />} />

                    <Route path="/" element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } />

                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } />

                    {/* ROTA DE IMPRESSÃO: Não usa ProtectedRoute nem Layout */}
                    <Route path="/print-preview" element={<PrintPreviewPage />} />

                    {/* ROTA DE AGENDAMENTO */}
                    <Route path="/agendamento" element={
                      <ProtectedRoute>
                        <SchedulingPage />
                      </ProtectedRoute>
                    } />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </React.Suspense>
              </BrowserRouter>
              <ToasterWrapper />
            </PrintProvider>
          </PWAInstallProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;