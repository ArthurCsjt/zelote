import { MobileToaster } from "@/components/ui/mobile-toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip"; // ALTERAÇÃO 2: Desativado para o teste
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ALTERAÇÃO 1: Corrigimos as importações para a nova arquitetura
import { AuthProvider } from "./providers/AuthProvider";
import { useAuth } from "./contexts/AuthContext";

import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* <TooltipProvider> */} {/* ALTERAÇÃO 2: Desativado para o teste */}
          <MobileToaster />
          <Sonner />
          
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
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        {/* </TooltipProvider> */} {/* ALTERAÇÃO 2: Desativado para o teste */}
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;