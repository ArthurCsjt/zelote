import { useState, useEffect, useCallback } from "react";
import { ActiveLoans } from "@/components/ActiveLoans";
import { LoanForm } from "@/components/LoanForm";
import { useDatabase } from "@/hooks/useDatabase";
import type { LoanHistoryItem } from "@/types/database";
import { TabbedContent } from "./TabbedContent";
import { SectionHeader } from "./Shared/SectionHeader";
import { ClipboardList } from "lucide-react";

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
    <div className="min-h-screen relative py-[30px]">
      { /* Background grid pattern */}
      <div className="absolute inset-0 -z-10 bg-white dark:bg-zinc-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container mx-auto p-4 max-w-5xl relative z-10">
        <div className="mb-8 text-center p-6 neo-container-yellow">
          <SectionHeader
            title="HUB DE EMPRÉSTIMOS"
            description="REGISTRE NOVOS EMPRÉSTIMOS OU GERENCIE OS ATIVOS"
            icon={ClipboardList}
            iconColor="text-black dark:text-white"
            className="flex flex-col items-center uppercase tracking-tight font-black"
          />
        </div>

        <TabbedContent
          tabs={loanTabs}
          defaultValue={defaultTab}
          className="w-full"
          listClassName="grid-cols-2 neo-card p-0 gap-0 border-b-0"
          value={currentTab}
          onValueChange={(v) => {
            setCurrentTab(v as 'form' | 'active');
          }}
        />
      </div>
    </div>
  );
};