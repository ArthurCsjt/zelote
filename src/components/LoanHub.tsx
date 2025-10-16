import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ActiveLoans } from "@/components/ActiveLoans";
import { LoanForm } from "@/components/LoanForm";
import { useDatabase } from "@/hooks/useDatabase";
import type { LoanHistoryItem } from "@/types/database";
import { TabbedContent } from "./TabbedContent"; // Importando TabbedContent

export const LoanHub = () => {
  const { getLoanHistory } = useDatabase();
  const [loanHistory, setLoanHistory] = useState<LoanHistoryItem[]>([]);

  const loadData = useCallback(async () => {
    const historyData = await getLoanHistory();
    setLoanHistory(historyData);
  }, [getLoanHistory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      content: <ActiveLoans />,
    },
  ];

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Empréstimos de Chromebook</h1>
      </div>
      
      <TabbedContent
        tabs={loanTabs}
        defaultValue="form"
        listClassName="grid-cols-2"
      />
    </div>
  );
};