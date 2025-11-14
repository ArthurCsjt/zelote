import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, startOfDay, endOfDay, differenceInMinutes } from "date-fns";
import type { LoanHistoryItem, Chromebook } from "@/types/database";
import { Badge } from "./ui/badge";
import { Computer, Download, ArrowLeft, BarChart as BarChartIcon, RefreshCw, Info, Zap, Waves, History as HistoryIcon, CalendarRange } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { SectionHeader } from "./Shared/SectionHeader";
import { DashboardDetailDialog } from "./DashboardDetailDialog";
import { cn } from '@/lib/utils';
import { useDashboardData, PeriodView } from '@/hooks/useDashboardData';
import { useDatabase } from '@/hooks/useDatabase';
import { useOverdueLoans } from '@/hooks/useOverdueLoans';
import { CollapsibleDashboardFilter } from "./CollapsibleDashboardFilter";
import { DashboardStatsGrid } from "./dashboard/DashboardStatsGrid";
import { DashboardCharts } from "./dashboard/DashboardCharts";
import { useDashboardExport } from "../hooks/useDashboardExport";
import { UsageRateCard } from "./dashboard/UsageRateCard";
import { SecondaryInsightsGrid } from "./dashboard/SecondaryInsightsGrid"; // NOVO IMPORT

interface DashboardProps {
  onBack?: () => void;
}

// Tipos para o estado do modal
type DetailItem = {
  id: string;
  chromebook_id: string;
  model: string;
  status?: Chromebook['status'];
  loan_date?: string;
  expected_return_date?: string;
  student_name?: string;
  isOverdue?: boolean;
};

type DetailModalState = {
  open: boolean;
  title: string;
  description: string;
  dataType: 'chromebooks' | 'loans';
  data: DetailItem[] | null;
  isLoading: boolean;
};

export function DashboardLayout({
  onBack
}: DashboardProps) {
  const {
    toast
  } = useToast();
  
  // NOVO ESTADO: Para controlar a animação de montagem
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Ativa a animação após um pequeno delay para garantir que o componente esteja no DOM
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  // NOVO ESTADO: Datas de início e fim para o filtro dinâmico
  const [startDate, setStartDate] = useState<Date | null>(startOfDay(new Date())); // PADRÃO: HOJE
  const [endDate, setEndDate] = useState<Date | null>(endOfDay(new Date())); // Padrão: Hoje
  
  // O PeriodView agora só controla a visualização (Gráficos vs. Histórico)
  const [periodView, setPeriodView] = useState < PeriodView | 'charts' > ('charts');
  
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(19);
  
  const { 
    loading, 
    history, 
    chromebooks, 
    filteredLoans, 
    filteredReturns, 
    periodChartData, 
    stats, 
    refreshData 
  } = useDashboardData(
    periodView === 'charts' ? startDate : null, // Passa datas apenas se estiver em modo 'charts'
    periodView === 'charts' ? endDate : null,
    startHour, 
    endHour
  );
  
  const { getChromebooksByStatus } = useDatabase();
  const { handleDownloadPDF } = useDashboardExport(); // USANDO O NOVO HOOK

  // ESTADO DO MODAL DE DETALHES
  const [detailModal, setDetailModal] = useState<DetailModalState>({
    open: false,
    title: '',
    description: '',
    dataType: 'chromebooks',
    data: null,
    isLoading: false,
  });

  // Função para abrir o modal e carregar dados dinamicamente
  const handleCardClick = useCallback(async (
    title: string, 
    description: string, 
    dataType: 'chromebooks' | 'loans', 
    initialData: DetailItem[] | null,
    statusFilter?: Chromebook['status']
  ) => {
    setDetailModal({
      open: true,
      title,
      description,
      dataType,
      data: initialData,
      isLoading: !initialData, // Se não houver dados iniciais (como para status), carrega
    });

    if (statusFilter && dataType === 'chromebooks') {
      setDetailModal(prev => ({ ...prev, isLoading: true }));
      const chromebooksData = await getChromebooksByStatus(statusFilter);
      
      const mappedData: DetailItem[] = chromebooksData.map(cb => ({
        id: cb.id,
        chromebook_id: cb.chromebook_id,
        model: cb.model,
        status: cb.status,
      }));
      
      setDetailModal(prev => ({
        ...prev,
        data: mappedData,
        isLoading: false,
      }));
    }
    
    // Se for loans, os dados já vêm pré-filtrados (history.filter)
    if (dataType === 'loans' && initialData) {
        setDetailModal(prev => ({ ...prev, data: initialData, isLoading: false }));
    }
    
  }, [getChromebooksByStatus]);
  
  // NOVO: Função para lidar com o clique no Pico de Uso (agora apenas aplica o filtro)
  const handleApplyFilter = () => {
    // O CollapsibleDashboardFilter já atualiza startDate/endDate/startHour/endHour no estado.
    
    // VERIFICAÇÃO DE VALIDADE ANTES DE FORMATAR
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast({
            title: "Erro de Filtro",
            description: "As datas de início e fim são inválidas.",
            variant: "destructive"
        });
        return;
    }
    
    refreshData();
    toast({
      title: "Filtro Aplicado",
      description: `Análise atualizada para o período de ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')} (${startHour}h às ${endHour}h).`,
      variant: "info"
    });
  };


  const { overdueLoans, upcomingDueLoans } = useOverdueLoans();
  
  // Função para gerar o PDF do relatório (AGORA CHAMA O HOOK)
  const handleExportPDF = () => {
    if (periodView !== 'charts') {
      toast({
        title: "Atenção",
        description: "O download de relatórios só está disponível na aba 'Análise de Uso'.",
        variant: "destructive"
      });
      return;
    }
    
    handleDownloadPDF({
        history: history, // Passa o histórico completo para o PDF poder listar ativos
        stats: stats,
        startDate: startDate,
        endDate: endDate,
        startHour: startHour,
        endHour: endHour,
    });
  };
  
  // Quick Win: Badge "Novo"
  const isNewLoan = (loan: LoanHistoryItem) => {
    const loanDate = new Date(loan.loan_date);
    const now = new Date();
    const diffHours = differenceInMinutes(now, loanDate) / 60;
    return diffHours <= 24;
  };

  const periodOptions: { value: PeriodView | 'charts'; label: string; icon: React.ElementType }[] = [
    { value: 'charts', label: 'Análise de Uso', icon: BarChartIcon },
    { value: 'history', label: 'Histórico Completo', icon: HistoryIcon },
    // { value: 'reports', label: 'Relatórios Inteligentes', icon: Brain }, // Mantido como placeholder
  ];
  
  // Badge de Período Ativo
  const periodBadge = useMemo(() => {
    if (periodView !== 'charts' || !startDate || !endDate) return null;
    
    // Adicionando verificação de validade da data
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

    const startFmt = format(startDate, 'dd/MM');
    const endFmt = format(endDate, 'dd/MM');
    const dateRange = startFmt === endFmt ? startFmt : `${startFmt} - ${endFmt}`;
    
    return (
      <Badge variant="info" className="text-sm font-medium">
        <CalendarRange className="h-3 w-3 mr-1" />
        {dateRange} | {startHour}h - {endHour}h
      </Badge>
    );
  }, [periodView, startDate, endDate, startHour, endHour]);


  return (
    <div className="space-y-8 relative py-[30px]">
      { /* Background gradient overlay */ }
      <div className="absolute inset-0 -z-10 bg-transparent blur-2xl transform scale-110 py-[25px] rounded-3xl bg-[#000a0e]/0" />
      
      {/* Header: Title and Download Button */}
      <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10 gap-4", isMounted ? 'animate-fadeIn animation-delay-0' : 'opacity-0')}>
        <SectionHeader 
          title="Dashboard" 
          description="Análise de uso e estatísticas de empréstimos"
          icon={BarChartIcon}
          iconColor="text-primary"
        />
        <div className="flex items-center gap-3 w-full sm:w-auto">
          
          {/* Botão de Download PDF (DESIGN MELHORADO) */}
          {periodView === 'charts' && (
            <Button 
              variant="default" 
              onClick={handleExportPDF} 
              className={cn(
                "flex items-center gap-2 bg-menu-green hover:bg-menu-green-hover text-white", // Usando cor verde de sucesso
                "shadow-md shadow-menu-green/30 transition-all duration-300"
              )} 
              disabled={loading || !stats}
            >
              <Download className="h-4 w-4" />
              <span className="hidden md:inline">Baixar Relatório (PDF)</span>
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={refreshData} 
            className="flex items-center gap-2 bg-card hover:bg-card-hover border-border" 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{loading ? 'Atualizando...' : 'Atualizar Dados'}</span>
          </Button>
          
          {/* NOVO: Select para seleção de visualização */}
          <Select value={periodView} onValueChange={(v) => setPeriodView(v as PeriodView | 'charts')}>
            <SelectTrigger className="w-full sm:w-[200px] h-10 bg-card border-border">
              <SelectValue placeholder="Selecione a Visualização" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border"> {/* ADICIONANDO CLASSES AQUI */}
              {periodOptions.map(option => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value} className="flex items-center">
                    <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {option.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtro de Hora (Aparece apenas no modo 'charts') */}
      {periodView === 'charts' && (
        <div className={cn("mt-6 space-y-4", isMounted ? 'animate-fadeIn animation-delay-100' : 'opacity-0')}>
            <CollapsibleDashboardFilter 
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                startHour={startHour}
                setStartHour={setStartHour}
                endHour={endHour}
                setEndHour={setEndHour}
                onApply={handleApplyFilter} // USANDO O NOVO HANDLER
                loading={loading}
            />
            {/* Badge de Período Ativo */}
            {periodBadge && (
                <div className="flex justify-start">
                    {periodBadge}
                </div>
            )}
        </div>
      )}

      {/* Linha 1 (Hero Card) */}
      {periodView === 'charts' && (
        <UsageRateCard stats={stats} isMounted={isMounted} />
      )}

      {/* Linha 2 (KPIs Principais - 4 colunas) */}
      {periodView === 'charts' && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 relative z-10">
          <DashboardStatsGrid 
            stats={stats}
            history={history}
            loading={loading}
            onCardClick={handleCardClick}
            isMounted={isMounted}
          />
        </div>
      )}
      
      {/* Linha 3 (Insights Secundários - 3 colunas) */}
      {periodView === 'charts' && (
        <SecondaryInsightsGrid isMounted={isMounted} />
      )}

      {/* Conteúdo Principal (Gráficos ou Histórico) */}
      <div className="space-y-4 mt-6">
        <DashboardCharts 
          periodView={periodView}
          loading={loading}
          periodChartData={periodChartData}
          stats={stats}
          totalChromebooks={stats?.totalChromebooks || 0}
          availableChromebooks={stats?.availableChromebooks || 0}
          userTypeData={stats?.userTypeData || []}
          durationData={stats?.durationData || []}
          isNewLoan={isNewLoan}
          history={history}
          isMounted={isMounted}
        />
      </div>
      
      {/* Modal de Detalhes */}
      <DashboardDetailDialog
        open={detailModal.open}
        onOpenChange={(open) => setDetailModal(prev => ({ ...prev, open }))}
        title={detailModal.title}
        description={detailModal.description}
        data={detailModal.data}
        isLoading={detailModal.isLoading}
        dataType={detailModal.dataType}
      />
      
    </div>
  );
}