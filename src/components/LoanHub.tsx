import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ActiveLoans } from "@/components/ActiveLoans";
import { LoanForm } from "@/components/LoanForm";
import { useDatabase } from "@/hooks/useDatabase";
import type { LoanHistoryItem, LoanFormData } from "@/types/database";
import { TabbedContent } from "./TabbedContent"; // Importando TabbedContent

interface LoanHubProps {
  onBack: () => void;
}

export const LoanHub = ({ onBack }: LoanHubProps) => {
  const { getLoanHistory } = useDatabase();
  const [activeLoans, setActiveLoans] = useState<LoanHistoryItem[]>([]);
  const [loanHistory, setLoanHistory] = useState<LoanHistoryItem[]>([]);

  const loadData = useCallback(async () => {
    // A lógica de carregamento de dados permanece aqui, mas o LoanHub não a usa diretamente para renderizar as abas.
    const historyData = await getLoanHistory();
    setLoanHistory(historyData);
    setActiveLoans(historyData.filter(loan => !loan.return_date)); 
  }, [getLoanHistory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loanTabs = [
    {
      value: 'form',
      title: 'Novo Empréstimo',
      content: (
        <div className="p-0"> {/* Removendo o padding extra aqui */}
          <LoanForm />
        </div>
      ),
    },
    {
      value: 'active',
      title: 'Empréstimos Ativos',
      content: <ActiveLoans />,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Removido o cabeçalho com o título e o botão 'Voltar ao Menu' */}
      
      <TabbedContent
        tabs={loanTabs}
        defaultValue="form"
        listClassName="grid-cols-2"
      />
    </div>
  );
};