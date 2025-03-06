
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Cria uma instância do QueryClient para gerenciar o estado das consultas
const queryClient = new QueryClient();

/**
 * Componente principal da aplicação
 * Configura os provedores globais e o roteamento
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Componentes para exibição de notificações toast */}
      <Toaster />
      <Sonner />
      
      {/* Configuração do roteamento da aplicação */}
      <BrowserRouter>
        <Routes>
          {/* Rota principal */}
          <Route path="/" element={<Index />} />
          
          {/* IMPORTANTE: Adicione todas as rotas personalizadas ACIMA da rota "*" */}
          
          {/* Rota de fallback para URLs não encontradas */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
