import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import { AuthProvider } from "./providers/AuthProvider";
import { useAuth } from "./contexts/AuthContext";

// PASSO 1: IMPORTAR O PROVIDER DO BANCO DE DADOS
import { DatabaseProvider } from './contexts/DatabaseContext'; // Ajuste o caminho se necessário

import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Layout from "./components/Layout"; // Importando Layout

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Componente Wrapper para a rota /settings
const SettingsWrapper = () => {
  const navigate = useNavigate();
  const handleBackToMenu = () => navigate('/', { replace: true });
  
  return (
    <Layout 
      title="Configurações" 
      subtitle="Gerencie configurações administrativas" 
      showBackButton 
      onBack={handleBackToMenu}
    >
      <Settings />
    </Layout>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* PASSO 2: O DATABASEPROVIDER DEVE ENVOLVER TODO O RESTO DA APLICAÇÃO */}
        <DatabaseProvider>
          {/* <TooltipProvider> */}
            {/* MobileToaster e Sonner removidos daqui */}
            
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsWrapper />
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          {/* </TooltipProvider> */}
        </DatabaseProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;