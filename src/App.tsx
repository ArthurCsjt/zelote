import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'sonner'; // Importando Toaster aqui

import { AuthProvider } from "./providers/AuthProvider";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./hooks/use-theme"; // Importando useTheme

// PASSO 1: IMPORTAR O PROVIDER DO BANCO DE DADOS
import { DatabaseProvider } from './contexts/DatabaseContext'; // Ajuste o caminho se necessário
import { PrintProvider } from './contexts/PrintContext'; // NOVO IMPORT
import { AuditProvider } from './providers/AuditProvider'; // NOVO IMPORT AQUI

import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import { PrintPreviewPage } from "./pages/PrintPreviewPage"; // NOVO IMPORT
import SchedulingPage from "./pages/SchedulingPage"; // NOVO IMPORT
import UpdatePasswordPage from "./pages/UpdatePassword"; // NOVO IMPORT
import Layout from "./components/Layout"; // Importando Layout
import { cn } from "./lib/utils"; // IMPORTANDO CN AQUI

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
  
  // Definindo estilos baseados no tema para o efeito Glassmorphism
  // Usamos classes Tailwind para o estilo base e o Sonner lida com as cores de richColors
  const toastClass = cn(
    "shadow-xl border",
    // Estilos de Glassmorphism (aplicados via CSS global no index.css, mas reforçados aqui)
    "bg-card/90 backdrop-blur-md",
    // Estilos específicos para Dark Mode
    theme === 'dark' ? "dark:border-gray-700 dark:bg-gray-800/90" : "border-gray-200 bg-white/90"
  );

  return (
    <Toaster 
      theme={theme} // Passando o tema dinamicamente
      position="top-center" 
      richColors 
      closeButton 
      className="z-[9999]"
      toastOptions={{
        className: toastClass, // Aplicando a classe de Glassmorphism
        style: {
          padding: '12px 16px',
          borderRadius: '12px',
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
                
                {/* NOVA ROTA DE ATUALIZAÇÃO DE SENHA */}
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
                
                <Route path="/print-preview" element={
                  <ProtectedRoute>
                    <PrintPreviewPage />
                  </ProtectedRoute>
                } />
                
                {/* NOVA ROTA DE AGENDAMENTO */}
                <Route path="/agendamento" element={
                  <ProtectedRoute>
                    <SchedulingPage />
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