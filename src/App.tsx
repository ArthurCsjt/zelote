import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'sonner'; // Importando Toaster aqui

import { AuthProvider } from "./providers/AuthProvider";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./hooks/use-theme"; // Importando useTheme

// PASSO 1: IMPORTAR O PROVIDER DO BANCO DE DADOS
import { DatabaseProvider } from './contexts/DatabaseContext'; // Ajuste o caminho se necessário
import { PrintProvider } from './contexts/PrintContext'; // NOVO IMPORT

import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import { PrintPreviewPage } from "./pages/PrintPreviewPage"; // NOVO IMPORT
import Layout from "./components/Layout"; // Importando Layout

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Componente Wrapper para o Toaster
const ToasterWrapper = () => {
  const { theme } = useTheme();
  
  return (
    <Toaster 
      theme={theme} // Passando o tema dinamicamente
      position="top-center" 
      richColors 
      closeButton 
      className="z-[9999]"
      toastOptions={{
        className: 'shadow-xl border-gray-200',
        style: {
          padding: '12px 16px',
          borderRadius: '12px',
          // Estilos Glassmorphism aprimorados
          backgroundColor: 'rgba(255, 255, 255, 0.95)', // Mais opaco
          backdropFilter: 'blur(20px)', // Mais blur
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(220, 220, 220, 0.7)', // Borda mais suave
        },
      }}
    />
  );
};


const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* PASSO 2: O DATABASEPROVIDER DEVE ENVOLVER TODO O RESTO DA APLICAÇÃO */}
        <DatabaseProvider>
          <PrintProvider> {/* NOVO: PrintProvider */}
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
                    <Settings />
                  </ProtectedRoute>
                } />
                
                {/* NOVA ROTA DE IMPRESSÃO: Envolvida em Layout para usar o cabeçalho */}
                <Route path="/print-preview" element={
                  <ProtectedRoute>
                    <PrintPreviewPage />
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <ToasterWrapper /> {/* Renderizando o Toaster aqui */}
          </PrintProvider>
        </DatabaseProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;