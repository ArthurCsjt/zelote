
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveLoans } from "@/components/ActiveLoans";
import { LoanHistory } from "@/components/LoanHistory";
import { LoanForm } from "@/components/LoanForm";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    const [active, history] = await Promise.all([getActiveLoans(), getLoanHistory()]);
    setActiveLoans(active);
    setLoanHistory(history);
  }, [getActiveLoans, getLoanHistory]);

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
      <ScrollArea className="flex-grow">
        <Tabs defaultValue="form" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="form">Novo Empréstimo</TabsTrigger>
            <TabsTrigger value="active">Empréstimos Ativos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="form">
            <div className="p-4">
              <LoanForm />
            </div>
          </TabsContent>
          <TabsContent value="active">
            <ActiveLoans />
          </TabsContent>
          <TabsContent value="history">
            <LoanHistory history={loanHistory} />
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
};
