import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveLoans } from "@/components/ActiveLoans";
import { LoanHistory } from "@/components/LoanHistory";
import { LoanForm } from "@/components/LoanForm";
import { useDatabase } from "@/hooks/useDatabase";
import type { LoanHistoryItem, LoanFormData } from "@/types/database";

interface LoanHubProps {
  onBack: () => void;
}

export const LoanHub = ({ onBack }: LoanHubProps) => {
  const { getActiveLoans, getLoanHistory, createLoan } = useDatabase();
  const [activeLoans, setActiveLoans] = useState<LoanHistoryItem[]>([]);
  const [loanHistory, setLoanHistory] = useState<LoanHistoryItem[]>([]);

  const loadData = useCallback(async () => {
    // Ainda precisamos carregar o histórico completo para o Dashboard, mas o LoanHub não o exibe mais.
    const historyData = await getLoanHistory();
    setLoanHistory(historyData);
    setActiveLoans(historyData.filter(loan => !loan.return_date)); 
  }, [getLoanHistory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNewLoan = async (data: LoanFormData) => {
    const newLoan = await createLoan(data);
    if (newLoan) {
      loadData(); // Recarrega os dados para mostrar o novo empréstimo
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Empréstimos de Chromebook</h1>
        <Button onClick={onBack} variant="outline">Voltar ao Menu</Button>
      </div>
      
      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">Novo Empréstimo</TabsTrigger>
          <TabsTrigger value="active">Empréstimos Ativos</TabsTrigger>
        </TabsList>
        <TabsContent value="form">
          <div className="p-4">
            {/* O LoanForm já lida com a criação de empréstimos */}
            <LoanForm />
          </div>
        </TabsContent>
        <TabsContent value="active">
          {/* ActiveLoans já busca seus próprios dados e lida com devoluções */}
          <ActiveLoans />
        </TabsContent>
      </Tabs>
    </div>
  );
};