
import { MobileToaster } from "@/components/ui/mobile-toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { AuthProvider } from "./providers/AuthProvider";
import { DatabaseProvider } from "./contexts/DatabaseContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

// Cria uma instância do QueryClient para gerenciar o estado das consultas
const queryClient = new QueryClient();

/**
 * Componente que verifica se o usuário está autenticado
 * Se não estiver, redireciona para a página de login
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  // Se não estiver autenticado, redireciona para a página de login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Se estiver autenticado, renderiza o conteúdo protegido
  return <>{children}</>;
};

/**
 * Componente principal da aplicação
 * Configura os provedores globais e o roteamento
 */
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DatabaseProvider>
          <TooltipProvider>
          {/* Componentes para exibição de notificações toast */}
          <MobileToaster />
          <Sonner />
          
          {/* Configuração do roteamento da aplicação */}
          <BrowserRouter>
            <Routes>
              {/* Rota de login (pública) */}
              <Route path="/login" element={<Login />} />
              
              {/* Rota principal (protegida) */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              
              {/* Configurações (somente super admin via página) */}
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
              {/* IMPORTANTE: Adicione todas as rotas personalizadas ACIMA da rota "*" */}
              
              {/* Rota de fallback para URLs não encontradas */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </DatabaseProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
