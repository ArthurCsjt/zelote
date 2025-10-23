import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ActiveLoans } from "@/components/ActiveLoans";
import { LoanForm } from "@/components/LoanForm";
import { ReturnForm } from "@/components/ReturnForm"; // NOVO IMPORT
import { useDatabase } from "@/hooks/useDatabase";
import type { LoanHistoryItem, LoanFormData } from "@/types/database";
import { TabbedContent } from "./TabbedContent";

interface LoanHubProps {
  onBack?: () => void;
  defaultTab?: 'form' | 'active' | 'return'; // ATUALIZADO: Adicionando 'return'
  initialChromebookId?: string; // NOVO: Para pré-selecionar na devolução
}

export const LoanHub = ({ onBack, defaultTab = 'form', initialChromebookId }: LoanHubProps) => {
  const { getLoanHistory } = useDatabase();
  const [activeLoans, setActiveLoans] = useState<LoanHistoryItem[]>([]);
  const [loanHistory, setLoanHistory] = useState<LoanHistoryItem[]>([]);
  const [currentTab, setCurrentTab] = useState(defaultTab);
  const [chromebookIdToReturn, setChromebookIdToReturn] = useState<string | undefined>(initialChromebookId);

  // Sincroniza o estado inicial do Chromebook
  useEffect(() => {
    setChromebookIdToReturn(initialChromebookId);
    if (initialChromebookId) {
      setCurrentTab('return');
    }
  }, [initialChromebookId]);

  const loadData = useCallback(async () => {
    const historyData = await getLoanHistory();
    setLoanHistory(historyData);
    setActiveLoans(historyData.filter(loan => !loan.return_date)); 
  }, [getLoanHistory]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Função para navegar para a aba de devolução e pré-selecionar o ID
  const handleNavigateToReturn = (chromebookId: string) => {
    setChromebookIdToReturn(chromebookId);
    setCurrentTab('return');
  };
  
  // Função para limpar o ID após a devolução bem-sucedida
  const handleReturnSuccess = () => {
    setChromebookIdToReturn(undefined);
    // Opcional: Navegar para a aba de ativos após a devolução
    setCurrentTab('active');
    loadData(); // Recarrega a lista de ativos
  };

  const loanTabs = [
    {
      value: 'form',
      title: 'Novo Empréstimo',
      content: (
        <div className="p-0">
          <LoanForm />
        </div>
      ),
    },
    {
      value: 'active',
      title: 'Empréstimos Ativos',
      // Passa a função de navegação para o ActiveLoans
      content: <ActiveLoans onNavigateToReturn={handleNavigateToReturn} />, 
    },
    {
      value: 'return', // NOVA ABA
      title: 'Registrar Devolução',
      content: (
        <div className="p-0">
          <ReturnForm 
            initialChromebookId={chromebookIdToReturn} 
            onReturnSuccess={handleReturnSuccess}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <TabbedContent
        tabs={loanTabs}
        defaultValue={defaultTab}
        className="max-w-4xl mx-auto"
        listClassName="grid-cols-3" // 3 ABAS
        // Controla a aba ativa via estado local
        value={currentTab}
        onValueChange={(v) => {
          setCurrentTab(v as 'form' | 'active' | 'return');
          // Limpa o ID de pré-seleção se mudar para outra aba
          if (v !== 'return') {
            setChromebookIdToReturn(undefined);
          }
        }}
      />
    </div>
  );
};