import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'sonner';

import { AuthProvider } from "./providers/AuthProvider";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./hooks/use-theme";

// REMOVIDO: DatabaseProvider (código duplicado - usar apenas useDatabase hook)
import { PrintProvider } from './contexts/PrintContext';
import { AuditProvider } from './providers/AuditProvider';
import logger from "@/utils/logger";

import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import { PrintPreviewPage } from "./pages/PrintPreviewPage";
import SchedulingPage from "./pages/SchedulingPage";
import UpdatePasswordPage from "./pages/UpdatePassword";
import Layout from "./components/Layout";
import { cn } from "./lib/utils";

const queryClient = new QueryClient();

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
          {/* REMOVIDO: DatabaseProvider - usar useDatabase hook diretamente nos componentes */}
          <PrintProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />

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
            </BrowserRouter>
            <ToasterWrapper />
          </PrintProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;