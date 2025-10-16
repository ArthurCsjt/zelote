import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DatabaseProvider } from './contexts/DatabaseContext'; 

import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index"; // Agora é o Dashboard
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

// Importando o novo layout e os hubs de conteúdo
import { ZeloteLayout } from "./components/ZeloteLayout";
import { RegistrationHub } from "./components/RegistrationHub";
import { InventoryHub } from "./components/InventoryHub";
import { LoanHub } from "./components/LoanHub";
import { AuditHub } from "./components/audit/AuditHub";
import { AuditProvider } from "./providers/AuditProvider";
import { ReturnDialog } from "./components/ReturnDialog"; // Mantendo o ReturnDialog para a rota /return

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Componente Wrapper para as rotas que usam o layout
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <ZeloteLayout>{children}</ZeloteLayout>
);

// Componente para a rota de Devolução (que usa um modal/dialog)
const ReturnWrapper = () => {
  const navigate = useNavigate();
  // Simulação de estados necessários para o ReturnDialog
  const [openReturnDialog, setOpenReturnDialog] = useState(true);
  const [chromebookId, setChromebookId] = useState("");
  const [returnData, setReturnData] = useState<any>({ name: "", ra: "", email: "", type: 'individual', userType: 'aluno' });

  const handleClose = () => {
    setOpenReturnDialog(false);
    navigate('/', { replace: true });
  };
  
  const handleConfirm = (ids: string[], data: any) => {
    // Lógica de confirmação de devolução (a ser implementada no useDatabase)
    console.log("Devolução confirmada para IDs:", ids, "por:", data.name);
    handleClose();
  };

  return (
    <ZeloteLayout>
      <Index /> {/* Renderiza o Dashboard por baixo */}
      <ReturnDialog 
        open={openReturnDialog} 
        onOpenChange={handleClose} 
        chromebookId={chromebookId} 
        onChromebookIdChange={setChromebookId} 
        returnData={returnData} 
        onReturnDataChange={setReturnData} 
        onConfirm={handleConfirm} 
      />
    </ZeloteLayout>
  );
};


const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DatabaseProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <Index /> {/* Dashboard */}
                  </LayoutWrapper>
                </ProtectedRoute>
              } />
              
              <Route path="/registration" element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <RegistrationHub onBack={() => {}} onRegistrationSuccess={() => {}} />
                  </LayoutWrapper>
                </ProtectedRoute>
              } />
              
              <Route path="/inventory" element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <InventoryHub />
                  </LayoutWrapper>
                </ProtectedRoute>
              } />
              
              <Route path="/loan" element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <LoanHub onBack={() => {}} />
                  </LayoutWrapper>
                </ProtectedRoute>
              } />
              
              <Route path="/audit" element={
                <ProtectedRoute>
                  <AuditProvider>
                    <LayoutWrapper>
                      <AuditHub />
                    </LayoutWrapper>
                  </AuditProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <Settings />
                  </LayoutWrapper>
                </ProtectedRoute>
              } />
              
              {/* Rota de Devolução (usando o modal) */}
              <Route path="/return" element={
                <ProtectedRoute>
                  <ReturnWrapper />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DatabaseProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;