import { useState } from 'react';
import { useAudit } from '@/contexts/AuditContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, History, FileText, Trash2, ListChecks, BarChart3, Eye } from 'lucide-react';
import { AuditScanner } from './AuditScanner';
import { AuditStats } from './AuditStats';
import { AuditFiltersComponent } from './AuditFilters';
import { AuditReportComponent } from './AuditReport';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GlassCard, CardFooter } from '@/components/ui/GlassCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // Importando Dialog
import type { AuditReport, InventoryAudit } from '@/types/database'; // Importando tipos
import { SectionHeader } from '../Shared/SectionHeader';
import { TabbedContent } from '../TabbedContent';
import { cn } from '@/lib/utils';


export const AuditHub = () => {
  const {
    activeAudit,
    completedAudits,
    countedItems,
    filteredItems,
    totalExpected,
    isProcessing,
    filters,
    setFilters,
    startAudit,
    generateReport,
    calculateStats: auditStats, // RENOMEADO AQUI
    deleteAudit,
    reloadAudits
  } = useAudit();
  const [newAuditName, setNewAuditName] = useState('');
  const [activeTab, setActiveTab] = useState('current');

  // NOVO ESTADO: Para exibir o relatório detalhado de uma auditoria concluída
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [detailedReport, setDetailedReport] = useState<AuditReport | null>(null);
  const [reportAuditName, setReportAuditName] = useState('');
  const [isReportLoading, setIsReportLoading] = useState(false);


  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'history') {
      reloadAudits();
    }
  };

  const handleStartAudit = () => {
    if (newAuditName.trim()) {
      startAudit(newAuditName.trim());
      setNewAuditName('');
    }
  };

  const handleViewReport = async (audit: InventoryAudit) => {
    setIsReportLoading(true);
    setReportAuditName(audit.audit_name);
    setReportModalOpen(true);

    const report = await generateReport(audit.id);

    setDetailedReport(report);
    setIsReportLoading(false);
  };

  if (activeAudit) {
    return (
      <div className="min-h-screen relative py-[30px]">
        <div className="absolute inset-0 -z-10 bg-white dark:bg-zinc-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="container mx-auto p-4 max-w-7xl relative z-10">
          <div className="mb-8 text-center p-6 neo-container-yellow">
            <SectionHeader
              title="Contagem Ativa"
              description={`AUDITORIA: ${activeAudit.audit_name}`}
              icon={ListChecks}
              iconColor="text-black dark:text-white"
              className="flex flex-col items-center uppercase tracking-tight font-black"
            />
          </div>
          <AuditScanner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative py-[30px]">
      <div className="absolute inset-0 -z-10 bg-white dark:bg-zinc-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="container mx-auto p-4 max-w-7xl relative z-10">

        <div className="mb-8 text-center p-6 neo-container-yellow">
          <SectionHeader
            title="HUB DE AUDITORIA"
            description="GERENCIE E REALIZE CONTROLE DE INVENTÁRIO"
            icon={ListChecks}
            iconColor="text-black dark:text-white"
            className="flex flex-col items-center uppercase tracking-tight font-black"
          />
        </div>

        <TabbedContent
          tabs={[
            {
              value: 'current',
              title: (
                <div className="flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>INICIAR CONTAGEM</span>
                </div>
              ),
              content: (
                <div className="space-y-6">
                  <div className="neo-container">
                    <CardHeader className="border-b-4 border-black dark:border-white bg-yellow-300 dark:bg-yellow-900/50 p-6">
                      <CardTitle className="flex items-center gap-2 text-black dark:text-white font-black uppercase tracking-tight">
                        <Plus className="h-5 w-5" />
                        Iniciar Nova Auditoria
                      </CardTitle>
                      <CardDescription className="text-black/70 dark:text-white/70 font-bold text-xs uppercase tracking-wide">
                        Comece uma nova sessão de contagem de inventário para verificar a localização e o estado dos equipamentos.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <AlertDialog onOpenChange={(open) => !open && setNewAuditName('')}>
                        <AlertDialogTrigger asChild>
                          <Button disabled={isProcessing} className="w-full neo-btn bg-menu-teal hover:bg-menu-teal-hover h-12 text-base">
                            {isProcessing ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <ListChecks className="mr-2 h-4 w-4" />
                                Iniciar Nova Contagem
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-4 border-black dark:border-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-900 max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-black uppercase text-xl">Iniciar Nova Contagem</AlertDialogTitle>
                            <AlertDialogDescription>
                              Dê um nome para esta sessão de auditoria. Ex: "Contagem Mensal - Outubro"
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="audit-name" className="font-bold uppercase text-xs">Nome da Auditoria</Label>
                              <Input
                                id="audit-name"
                                value={newAuditName}
                                onChange={(e) => setNewAuditName(e.target.value)}
                                className="neo-input"
                                placeholder="Contagem Semanal"
                                autoComplete="off"
                              />
                            </div>
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="neo-btn bg-white hover:bg-gray-100 text-black border-2 border-black h-10">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleStartAudit} disabled={!newAuditName.trim() || isProcessing} className="neo-btn bg-menu-teal hover:bg-menu-teal-hover h-10">
                              Confirmar e Iniciar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </div>

                  {/* Últimas Auditorias Concluídas (Resumo) */}
                  <div className="neo-container">
                    <CardHeader className="border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-6">
                      <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
                        <History className="h-5 w-5" />
                        Últimas Auditorias Concluídas
                      </CardTitle>
                      <CardDescription className="text-black/70 dark:text-white/70 font-bold text-xs uppercase tracking-wide">
                        Visualize rapidamente as últimas auditorias concluídas.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {completedAudits && completedAudits.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table className="min-w-[600px]">
                            <TableHeader>
                              <TableRow className="bg-gray-100 dark:bg-zinc-800">
                                <TableHead className="font-black text-black dark:text-white uppercase text-xs">Nome</TableHead>
                                <TableHead className="text-right font-black text-black dark:text-white uppercase text-xs">Finalizada</TableHead>
                                <TableHead className="text-right font-black text-black dark:text-white uppercase text-xs">Itens</TableHead>
                                <TableHead className="text-right font-black text-black dark:text-white uppercase text-xs">Conclusão</TableHead>
                                <TableHead className="text-right font-black text-black dark:text-white uppercase text-xs">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {completedAudits.slice(0, 5).map((audit) => (
                                <TableRow key={audit.id} className="hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors border-b-2 border-black/10 dark:border-white/10">
                                  <TableCell className="font-medium text-sm">{audit.audit_name}</TableCell>
                                  <TableCell className="text-right text-xs">
                                    {audit.completed_at
                                      ? format(new Date(audit.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                                      : 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-mono">{audit.total_counted ?? 'N/A'}</TableCell>
                                  <TableCell className="text-right text-sm font-mono">
                                    {audit.total_expected && audit.total_counted
                                      ? `${((audit.total_counted / audit.total_expected) * 100).toFixed(1)}%`
                                      : 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleViewReport(audit)} title="Ver Relatório Detalhado" className="h-8 w-8 p-0 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-800">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma auditoria concluída para exibir.</p>
                      )}
                      <div className="mt-4 flex justify-end">
                        <Button variant="secondary" onClick={() => handleTabChange('history')} className="neo-btn bg-gray-200 hover:bg-gray-300 text-black border-2 border-black h-10">Ver histórico completo</Button>
                      </div>
                    </CardContent>
                  </div>
                </div>
              )
            },
            {
              value: 'history',
              title: (
                <div className="flex items-center justify-center gap-2">
                  <History className="h-4 w-4" />
                  <span>HISTÓRICO</span>
                </div>
              ),
              content: (
                <div className="neo-container p-0">
                  <CardHeader className="border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-6">
                    <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
                      <History className="h-5 w-5" />
                      Histórico de Auditorias
                    </CardTitle>
                    <CardDescription className="text-black/70 dark:text-white/70 font-bold text-xs uppercase tracking-wide">
                      Visualize as auditorias de inventário que já foram concluídas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {completedAudits && completedAudits.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table className="min-w-[700px]">
                          <TableHeader>
                            <TableRow className="bg-gray-100 dark:bg-zinc-800">
                              <TableHead className="font-black text-black dark:text-white uppercase text-xs">Nome da Auditoria</TableHead>
                              <TableHead className="text-right font-black text-black dark:text-white uppercase text-xs">Data de Finalização</TableHead>
                              <TableHead className="text-right font-black text-black dark:text-white uppercase text-xs">Itens Contados</TableHead>
                              <TableHead className="text-right font-black text-black dark:text-white uppercase text-xs">Taxa de Conclusão</TableHead>
                              <TableHead className="text-right font-black text-black dark:text-white uppercase text-xs">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {completedAudits.map((audit) => (
                              <TableRow key={audit.id} className="hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors border-b-2 border-black/10 dark:border-white/10">
                                <TableCell className="font-medium text-sm">{audit.audit_name}</TableCell>
                                <TableCell className="text-right text-xs">
                                  {audit.completed_at
                                    ? format(new Date(audit.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                                    : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right text-sm font-mono">
                                  {audit.total_counted || 'N/A'}
                                </TableCell>
                                <TableCell className="text-right text-sm font-mono">
                                  {audit.total_expected && audit.total_counted
                                    ? `${((audit.total_counted / audit.total_expected) * 100).toFixed(1)}%`
                                    : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" onClick={() => handleViewReport(audit)} title="Ver Relatório Detalhado" className="h-8 w-8 p-0 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-800">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 h-8 w-8 p-0 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-red-100 hover:bg-red-200 text-red-700 border-red-900">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="border-4 border-black dark:border-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-900 max-w-md">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="font-black uppercase text-xl flex items-center gap-2">
                                          <Trash2 className="h-6 w-6 text-red-600" />
                                          Excluir Auditoria
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-base text-black dark:text-white font-medium">
                                          Esta ação removerá a auditoria "<strong className="bg-yellow-300 px-1 border border-black text-black">{audit.audit_name}</strong>" e todos os itens relacionados. Deseja continuar?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="neo-btn bg-white hover:bg-gray-100 text-black border-2 border-black h-10">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteAudit(audit.id)} className="neo-btn bg-red-600 hover:bg-red-700 text-white border-2 border-black h-10">
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma auditoria concluída para exibir.</p>
                    )}
                  </CardContent>
                </div>
              )
            }
          ]}
          value={activeTab}
          onValueChange={handleTabChange}
          defaultValue="current"
          listClassName="grid-cols-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        />

        {/* Modal de Relatório Detalhado */}
        <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] rounded-none sm:rounded-none">
            <DialogHeader className="p-6 pb-4 border-b-4 border-black dark:border-white bg-yellow-300 dark:bg-yellow-900/50">
              <DialogTitle className="text-2xl font-black uppercase text-black dark:text-white tracking-tight flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Relatório: {reportAuditName}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6">
              {isReportLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-menu-teal" />
                  <p className="ml-3 text-muted-foreground">Gerando relatório detalhado...</p>
                </div>
              ) : (
                <AuditReportComponent report={detailedReport} auditName={reportAuditName} />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};