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
    calculateStats,
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

  const stats = calculateStats();

  if (activeAudit) {
    return <AuditScanner />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <ListChecks className="h-7 w-7 text-menu-teal" />
          Sistema de Contagem de Inventário
        </h1>
        <p className="text-muted-foreground">Gerencie e realize auditorias de inventário de Chromebooks.</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Iniciar Contagem</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6 mt-6">
          <GlassCard className="border-menu-teal/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-menu-teal">
                <Plus className="h-5 w-5" />
                Iniciar Nova Auditoria
              </CardTitle>
              <CardDescription>
                Comece uma nova sessão de contagem de inventário para verificar a localização e o estado dos equipamentos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog onOpenChange={(open) => !open && setNewAuditName('')}>
                <AlertDialogTrigger asChild>
                  <Button disabled={isProcessing} className="w-full bg-menu-teal hover:bg-menu-teal-hover">
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
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Iniciar Nova Contagem</AlertDialogTitle>
                    <AlertDialogDescription>
                      Dê um nome para esta sessão de auditoria. Ex: "Contagem Mensal - Outubro"
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="audit-name" className="text-right">Nome</Label>
                      <Input
                        id="audit-name"
                        value={newAuditName}
                        onChange={(e) => setNewAuditName(e.target.value)}
                        className="col-span-3"
                        placeholder="Contagem Semanal"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStartAudit} disabled={!newAuditName.trim() || isProcessing}>
                      Confirmar e Iniciar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </GlassCard>

          {/* Auditorias já realizadas (resumo) */}
          <GlassCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Últimas Auditorias Concluídas
              </CardTitle>
              <CardDescription>
                Visualize rapidamente as últimas auditorias concluídas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedAudits && completedAudits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Finalizada</TableHead>
                      <TableHead className="text-right">Itens</TableHead>
                      <TableHead className="text-right">Conclusão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedAudits.slice(0, 5).map((audit) => (
                      <TableRow key={audit.id}>
                        <TableCell className="font-medium">{audit.audit_name}</TableCell>
                        <TableCell className="text-right">
                          {audit.completed_at
                            ? format(new Date(audit.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">{audit.total_counted ?? 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          {audit.total_expected && audit.total_counted
                            ? `${((audit.total_counted / audit.total_expected) * 100).toFixed(1)}%`
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleViewReport(audit)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma auditoria concluída para exibir.</p>
              )}
              <div className="mt-4 flex justify-end">
                <Button variant="secondary" onClick={() => handleTabChange('history')}>Ver histórico completo</Button>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6">
          <GlassCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Auditorias
              </CardTitle>
              <CardDescription>
                Visualize as auditorias de inventário que já foram concluídas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedAudits && completedAudits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Auditoria</TableHead>
                      <TableHead className="text-right">Data de Finalização</TableHead>
                      <TableHead className="text-right">Itens Contados</TableHead>
                      <TableHead className="text-right">Taxa de Conclusão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedAudits.map((audit) => (
                      <TableRow key={audit.id}>
                        <TableCell className="font-medium">{audit.audit_name}</TableCell>
                        <TableCell className="text-right">
                          {audit.completed_at
                            ? format(new Date(audit.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {audit.total_counted || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {audit.total_expected && audit.total_counted
                            ? `${((audit.total_counted / audit.total_expected) * 100).toFixed(1)}%`
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewReport(audit)} title="Ver Relatório Detalhado">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Auditoria</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação removerá a auditoria "{audit.audit_name}" e todos os itens relacionados. Deseja continuar?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteAudit(audit.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma auditoria concluída para exibir.</p>
              )}
            </CardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>
      
      {/* Modal de Relatório Detalhado */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{reportAuditName}</DialogTitle>
          </DialogHeader>
          {isReportLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-menu-teal" />
              <p className="ml-3 text-muted-foreground">Gerando relatório detalhado...</p>
            </div>
          ) : (
            <AuditReportComponent report={detailedReport} auditName={reportAuditName} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};