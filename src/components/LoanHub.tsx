import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ActiveLoans } from "@/components/ActiveLoans";
import { LoanForm } from "@/components/LoanForm";
import { ReturnForm } from "@/components/ReturnForm"; // Mantido o import, mas não usado nas abas
import { useDatabase } from "@/hooks/useDatabase";
import type { LoanHistoryItem, LoanFormData } from "@/types/database";
import { TabbedContent } from "./TabbedContent";

interface LoanHubProps {
  onBack?: () => void;
  defaultTab?: 'form' | 'active';
  // NOVO: Função para navegar para a view 'return' de nível superior
  onNavigateToReturnView: (chromebookId: string) => void; 
}

export const LoanHub = ({ onBack, defaultTab = 'form', onNavigateToReturnView }: LoanHubProps) => {
  const { getLoanHistory } = useDatabase();
  const [activeLoans, setActiveLoans] = useState<LoanHistoryItem[]>([]);
  const [loanHistory, setLoanHistory] = useState<LoanHistoryItem[]>([]);
  const [currentTab, setCurrentTab] = useState(defaultTab);

  const loadData = useCallback(async () => {
    const historyData = await getLoanHistory();
    setLoanHistory(historyData);
    setActiveLoans(historyData.filter(loan => !loan.return_date)); 
  }, [getLoanHistory]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Função que ActiveLoans chamará
  const handleNavigateToReturn = (chromebookId: string) => {
    onNavigateToReturnView(chromebookId);
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
  ];

  return (
    <div className="flex flex-col h-full">
      <TabbedContent
        tabs={loanTabs}
        defaultValue={defaultTab}
        className="max-w-4xl mx-auto"
        listClassName="grid-cols-2" // 2 ABAS
        // Controla a aba ativa via estado local
        value={currentTab}
        onValueChange={(v) => {
          setCurrentTab(v as 'form' | 'active');
        }}
      />
    </div>
  );
};