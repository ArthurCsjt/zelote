import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, differenceInMinutes } from "date-fns";
import type { LoanHistoryItem, Chromebook } from "@/types/database";
import { Badge } from "./ui/badge";
import {
  Computer,
  Download,
  ArrowLeft,
  BarChart as BarChartIcon,
  RefreshCw,
  Info,
  Zap,
  Waves,
  History as HistoryIcon,
  CalendarRange,
  School,
  AlertTriangle,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { FixedChromebooksPanel } from "./dashboard/FixedChromebooksPanel";
import { OverdueLoansPanel } from "./dashboard/OverdueLoansPanel";

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

type PresetType = 'hoje' | 'ontem' | '7dias' | 'mes' | 'ano' | 'custom';
type DashboardTab = 'overview' | 'fixed' | 'overdue';

export function DashboardLayout({
  onBack
}: DashboardProps) {
  const { toast } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [preset, setPreset] = useState<PresetType>('hoje');
  const [showCustomFilter, setShowCustomFilter] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Datas de início e fim para o filtro
  const [startDate, setStartDate] = useState<Date | null>(startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date | null>(endOfDay(new Date()));
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(19);

  const {
    loading,
    history,
    chromebooks,
    reservations,
    filteredLoans,
    filteredReturns,
    periodChartData,
    stats,
    refreshData
  } = useDashboardData(
    startDate,
    endDate,
    startHour,
    endHour
  );

  const { getChromebooksByStatus } = useDatabase();
  const { handleDownloadPDF } = useDashboardExport();

  // ESTADO DO MODAL DE DETALHES
  const [detailModal, setDetailModal] = useState<DetailModalState>({
    open: false,
    title: '',
    description: '',
    dataType: 'chromebooks',
    data: null,
    isLoading: false,
  });

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
      isLoading: !initialData,
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

    if (dataType === 'loans' && initialData) {
      setDetailModal(prev => ({ ...prev, data: initialData, isLoading: false }));
    }
  }, [getChromebooksByStatus]);

  // Seletor Rápido de Presets (1 Clique)
  const handlePresetSelect = (newPreset: PresetType) => {
    setPreset(newPreset);
    const now = new Date();

    if (newPreset === 'hoje') {
      setStartDate(startOfDay(now));
      setEndDate(endOfDay(now));
      setShowCustomFilter(false);
    } else if (newPreset === 'ontem') {
      const yesterday = subDays(now, 1);
      setStartDate(startOfDay(yesterday));
      setEndDate(endOfDay(yesterday));
      setShowCustomFilter(false);
    } else if (newPreset === '7dias') {
      setStartDate(startOfDay(subDays(now, 6)));
      setEndDate(endOfDay(now));
      setShowCustomFilter(false);
    } else if (newPreset === 'mes') {
      setStartDate(startOfMonth(now));
      setEndDate(endOfMonth(now));
      setShowCustomFilter(false);
    } else if (newPreset === 'ano') {
      setStartDate(startOfYear(now));
      setEndDate(endOfYear(now));
      setShowCustomFilter(false);
    } else if (newPreset === 'custom') {
      setShowCustomFilter(prev => !prev);
    }
  };

  const handleApplyFilter = () => {
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
      description: `Período atualizado: ${format(startDate, 'dd/MM')} a ${format(endDate, 'dd/MM')}.`,
      variant: "info"
    });
  };

  const handleExportPDF = () => {
    handleDownloadPDF({
      history: history,
      stats: stats,
      startDate: startDate,
      endDate: endDate,
      startHour: startHour,
      endHour: endHour,
    });
  };

  const periodBadge = useMemo(() => {
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

    const startFmt = format(startDate, 'dd/MM/yyyy');
    const endFmt = format(endDate, 'dd/MM/yyyy');
    const dateRange = startFmt === endFmt ? startFmt : `${startFmt} - ${endFmt}`;

    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-950/60 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black dark:text-white font-bold uppercase text-xs font-mono">
        <CalendarRange className="h-4 w-4 text-black dark:text-white" />
        {dateRange} ({startHour}h - {endHour}h)
      </div>
    );
  }, [startDate, endDate, startHour, endHour]);

  return (
    <div className="space-y-6 relative py-4 sm:py-8">
      {/* Background grid pattern */}
      <div className="absolute inset-0 -z-10 bg-white dark:bg-zinc-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Header com Título e Ações */}
      <div className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10 gap-4 p-4 sm:p-6 border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]",
        isMounted ? 'animate-fadeIn animation-delay-0' : 'opacity-0'
      )}>
        <SectionHeader
          title="DASHBOARD"
          description="CENTRAL DE COMANDO E INTELIGÊNCIA OPERACIONAL"
          icon={BarChartIcon}
          iconColor="text-black dark:text-white"
          className="uppercase tracking-tight font-black"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 border-2 border-black dark:border-white text-black dark:text-white rounded-none bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase font-bold text-xs"
            disabled={loading || !stats}
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </Button>

          <Button
            variant="ghost"
            onClick={refreshData}
            className="flex items-center gap-1.5 border-2 border-black dark:border-white text-black dark:text-white rounded-none bg-yellow-300 dark:bg-yellow-700 hover:bg-yellow-400 dark:hover:bg-yellow-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase font-bold text-xs"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>ATUALIZAR</span>
          </Button>
        </div>
      </div>

      {/* BARRA DE ATALHOS RÁPIDOS DE PERÍODO (Mobile-First 1 Toque) */}
      <div className={cn(
        "p-3 border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
        isMounted ? 'animate-fadeIn animation-delay-100' : 'opacity-0'
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-black uppercase tracking-tight text-gray-500 mr-1 hidden sm:inline">
              Período:
            </span>

            {[
              { key: 'hoje', label: 'Hoje' },
              { key: 'ontem', label: 'Ontem' },
              { key: '7dias', label: 'Últimos 7 Dias' },
              { key: 'mes', label: 'Este Mês' },
              { key: 'ano', label: 'Este Ano' },
              { key: 'custom', label: 'Personalizado ▾' },
            ].map((p) => {
              const isActive = preset === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => handlePresetSelect(p.key as PresetType)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-black uppercase font-mono border-2 border-black dark:border-white transition-all shrink-0 whitespace-nowrap",
                    isActive
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-gray-50 dark:bg-zinc-800 text-black dark:text-white hover:bg-yellow-200 dark:hover:bg-zinc-700"
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="shrink-0 flex items-center justify-end">
            {periodBadge}
          </div>
        </div>

        {/* Filtro Customizado Detalhado (Exibido apenas quando 'custom' está ativo) */}
        {showCustomFilter && (
          <div className="mt-4 pt-4 border-t-2 border-black dark:border-white">
            <CollapsibleDashboardFilter
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              startHour={startHour}
              setStartHour={setStartHour}
              endHour={endHour}
              setEndHour={setEndHour}
              onApply={handleApplyFilter}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* ABAS DE NAVEGAÇÃO DO DASHBOARD (Visão Geral | Salas Fixas | Atrasados) */}
      <div className="flex items-center gap-2 border-b-4 border-black dark:border-white pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-4 py-2 font-black text-xs uppercase border-2 border-black dark:border-white tracking-tight flex items-center gap-2 transition-all whitespace-nowrap",
            activeTab === 'overview'
              ? "bg-black text-white dark:bg-white dark:text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              : "bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
        >
          <BarChartIcon className="h-4 w-4" />
          Visão Geral & Gráficos
        </button>

        <button
          onClick={() => setActiveTab('fixed')}
          className={cn(
            "px-4 py-2 font-black text-xs uppercase border-2 border-black dark:border-white tracking-tight flex items-center gap-2 transition-all whitespace-nowrap",
            activeTab === 'fixed'
              ? "bg-blue-600 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              : "bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
        >
          <School className="h-4 w-4" />
          Chromebooks Fixos em Sala
          <Badge className="ml-1 bg-blue-100 text-blue-900 border border-black text-[10px] rounded-none font-mono">
            {stats?.totalFixed || 0}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={cn(
            "px-4 py-2 font-black text-xs uppercase border-2 border-black dark:border-white tracking-tight flex items-center gap-2 transition-all whitespace-nowrap",
            activeTab === 'overdue'
              ? "bg-red-600 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              : "bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800",
            (stats?.overdueCount || 0) > 0 && "ring-2 ring-red-500"
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          Atrasos Críticos
          {(stats?.overdueCount || 0) > 0 ? (
            <Badge className="ml-1 bg-red-500 text-white text-[10px] rounded-none font-mono animate-pulse">
              {stats?.overdueCount}
            </Badge>
          ) : (
            <Badge className="ml-1 bg-green-100 text-green-900 border border-black text-[10px] rounded-none font-mono">
              0
            </Badge>
          )}
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: VISÃO GERAL & GRÁFICOS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Card Hero: Taxa de Uso e Limite Operacional */}
          <UsageRateCard stats={stats} isMounted={isMounted} />

          {/* Grid de 6 KPIs Executivos */}
          <DashboardStatsGrid
            stats={stats}
            history={history}
            filteredLoans={filteredLoans}
            filteredReturns={filteredReturns}
            loading={loading}
            onCardClick={handleCardClick}
            onSelectTab={setActiveTab}
            isMounted={isMounted}
          />

          {/* Gráficos de Atividade, Ocupação Horária e Raio-X da Frota */}
          <DashboardCharts
            periodView="charts"
            loading={loading}
            periodChartData={periodChartData}
            stats={stats}
            totalChromebooks={stats?.totalChromebooks || 0}
            availableChromebooks={stats?.availableChromebooks || 0}
            userTypeData={stats?.userTypeData || []}
            durationData={stats?.durationData || []}
            isNewLoan={() => false}
            history={history}
            reservations={reservations}
            isMounted={isMounted}
          />
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: CHROMEBOOKS FIXOS POR SALA */}
      {activeTab === 'fixed' && (
        <div className="space-y-6">
          <FixedChromebooksPanel
            groups={stats?.fixedByClassroom || []}
            totalFixed={stats?.totalFixed || 0}
            onSelectChromebook={(cb) => handleCardClick(
              `Chromebook ${cb.chromebook_id}`,
              `Detalhes do equipamento alocado na sala ${cb.classroom || cb.location || 'Sem sala'}`,
              'chromebooks',
              [{
                id: cb.id,
                chromebook_id: cb.chromebook_id,
                model: cb.model,
                status: cb.status,
              }]
            )}
          />
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: ATRASOS CRÍTICOS & COBRANÇA */}
      {activeTab === 'overdue' && (
        <div className="space-y-6">
          <OverdueLoansPanel
            loans={stats?.overdueLoans || []}
          />
        </div>
      )}

      {/* Modal de Detalhes Dinâmico */}
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