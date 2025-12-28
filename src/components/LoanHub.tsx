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
  initialReservationData?: any;
}

export const LoanHub = ({ onBack, defaultTab = 'form', onNavigateToReturnView, initialReservationData }: LoanHubProps) => {
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
          <LoanForm initialReservationData={initialReservationData} />
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
    <div className="min-h-screen relative py-[10px]">
      { /* Background grid pattern like DashboardLayout */}
      <div className="absolute inset-0 -z-10 bg-white dark:bg-zinc-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container mx-auto p-2 max-w-7xl relative z-10">
        <div className="mb-3 text-center p-4 border-4 border-black dark:border-white bg-gradient-to-br from-violet-400 to-purple-500 dark:from-violet-600 dark:to-purple-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.9)]">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-black border-3 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                <ClipboardList className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white dark:text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)]">
                HUB DE EMPRÉSTIMOS
              </h2>
            </div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/90 dark:text-white/90">
              Registre novos empréstimos ou gerencie os ativos
            </p>
          </div>
        </div>

        <TabbedContent
          tabs={loanTabs}
          defaultValue={defaultTab}
          listClassName="grid-cols-2 border-[length:var(--neo-border-width)] border-[hsl(var(--neo-border-color))] bg-white dark:bg-zinc-900 shadow-[var(--neo-shadow)]"
          value={currentTab}
          onValueChange={(v) => {
            setCurrentTab(v as 'form' | 'active');
          }}
        />
      </div>
    </div>
  );
};