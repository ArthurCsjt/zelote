import { useState } from 'react';
import { useAudit } from '@/contexts/AuditContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QRCodeReader } from '@/components/QRCodeReader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode, ClipboardCheck, PlusCircle, Trash2, Clock, CheckCircle, AlertCircle, Monitor, MapPin, ListChecks, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AuditMissingItems } from './AuditMissingItems';
import { GlassCard } from '@/components/ui/GlassCard';
import { AuditFiltersComponent } from './AuditFilters'; // Importando filtros
import { cn } from '@/lib/utils';

export const AuditScanner = () => {
  const { 
    activeAudit, 
    countedItems, 
    filteredItems, 
    countItem, 
    completeAudit, 
    removeItem, 
    isProcessing, 
    totalExpected, 
    inventoryStats,
    missingItems,
    filters,
    setFilters,
  } = useAudit();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [manualId, setManualId] = useState('');
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  const handleScanSuccess = (scannedData: string) => {
    countItem(scannedData, 'qr_code');
    setIsScannerOpen(false);
  };

  const handleAddManualId = () => {
    if (manualId.trim()) {
      countItem(manualId.trim(), 'manual_id');
      setManualId('');
    }
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
    setItemToRemove(null);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'disponivel':
        return 'default';
      case 'emprestado':
        return 'secondary';
      case 'fixo':
        return 'outline';
      case 'manutencao':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getScanMethodBadge = (method: string) => {
    return method === 'qr_code' ? 'default' : 'secondary';
  };

  if (!activeAudit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
          <CardDescription>Aguardando dados da auditoria ativa.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        
        {/* Painel de Contagem (Foco Principal) - NEO-BRUTALISM */}
        <div className="neo-container">
          <CardHeader className="border-b-4 border-black dark:border-white bg-yellow-300 dark:bg-yellow-900/50 p-6">
            <CardTitle className="flex items-center gap-2 text-black dark:text-white font-black uppercase tracking-tight">
              <QrCode className="h-5 w-5" />
              Contagem Ativa: {activeAudit.audit_name}
            </CardTitle>
            <CardDescription className="text-black/70 dark:text-white/70 font-bold text-xs uppercase tracking-wide">
              Escaneie ou digite o ID do Chromebook.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 mb-6">
              
              {/* Botão de Scanner (Destaque) */}
              <Button onClick={() => setIsScannerOpen(true)} size="lg" className="w-full neo-btn bg-menu-teal hover:bg-menu-teal-hover h-12 text-base">
                <QrCode className="mr-2 h-5 w-5" />
                Escanear Item (QR Code)
              </Button>
              
              {/* Entrada Manual */}
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="manual-id" className="font-bold uppercase text-xs">Adicionar ID Manualmente</Label>
                <div className="flex space-x-2">
                  <Input
                    id="manual-id"
                    placeholder="Digite o ID, Patrimônio ou Série"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddManualId()}
                    autoComplete="off"
                    className="neo-input"
                  />
                  <Button onClick={handleAddManualId} disabled={!manualId.trim() || isProcessing} variant="secondary" className="neo-btn bg-gray-200 hover:bg-gray-300 text-black border-2 border-black h-10 w-10 p-0">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Botão de Finalizar */}
              <Button onClick={completeAudit} size="lg" variant="destructive" className="w-full mt-4 neo-btn bg-red-600 hover:bg-red-700 h-12 text-base" disabled={isProcessing || countedItems.length === 0}>
                {isProcessing ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <ClipboardCheck className="mr-2 h-5 w-5" />
                )}
                Finalizar Contagem ({countedItems.length} itens)
              </Button>
            </div>
          </CardContent>
        </div>
        
        {/* Painel de Itens Faltantes */}
        <AuditMissingItems 
          missingItems={missingItems}
          totalExpected={totalExpected}
          totalCounted={countedItems.length}
        />

        {/* Filtros e Lista de Itens Contados */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Coluna de Filtros e Estatísticas Rápidas */}
            <div className="lg:col-span-1 space-y-6">
                <AuditFiltersComponent 
                    filters={filters}
                    onFiltersChange={setFilters}
                    items={countedItems}
                />
                
                {/* Grid de cards de métricas (simplificado) - NEO-BRUTALISM */}
                <div className="neo-container p-0">
                    <CardHeader className="p-4 pb-2 border-b-2 border-black dark:border-white">
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Métricas Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 p-4">
                        {[
                            { title: 'Total Esperado', value: inventoryStats?.total ?? totalExpected, color: 'text-gray-500' },
                            { title: 'Itens Contados', value: countedItems.length, color: 'text-green-600' },
                            { title: 'Faltantes', value: missingItems.length, color: 'text-red-600' },
                            { title: 'Conclusão', value: `${totalExpected > 0 ? Math.round((countedItems.length / totalExpected) * 100) : 0}%`, color: 'text-blue-600' }
                        ].map((metric, index) => (
                            <div key={index} className="p-3 border-2 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <div className={cn("text-xl font-black", metric.color)}>{metric.value}</div>
                                <div className="text-xs text-muted-foreground mt-1 font-mono uppercase">{metric.title}</div>
                            </div>
                        ))}
                    </CardContent>
                </div>
            </div>
            
            {/* Coluna da Tabela de Itens Contados - NEO-BRUTALISM */}
            <div className="lg:col-span-2 neo-container p-0 overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50">
                    <CardTitle className="text-lg flex items-center gap-2 font-black uppercase tracking-tight">
                        <ListChecks className="h-5 w-5" />
                        Itens Contados ({filteredItems.length})
                    </CardTitle>
                    <CardDescription className="text-black/70 dark:text-white/70 font-bold text-xs uppercase tracking-wide">
                        Lista de todos os itens registrados nesta auditoria.
                    </CardDescription>
                </CardHeader>
                <ScrollArea className="h-[400px] w-full border-t border-black dark:border-white">
                    {filteredItems.length > 0 ? (
                        <Table>
                            <TableHeader className="bg-yellow-300 dark:bg-yellow-900/50 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-b-2 border-black dark:border-white">
                                    <TableHead className="font-black text-black dark:text-white uppercase text-xs">ID</TableHead>
                                    <TableHead className="font-black text-black dark:text-white uppercase text-xs">Modelo</TableHead>
                                    <TableHead className="font-black text-black dark:text-white uppercase text-xs">Localização</TableHead>
                                    <TableHead className="font-black text-black dark:text-white uppercase text-xs">Método</TableHead>
                                    <TableHead className="font-black text-black dark:text-white uppercase text-xs">Horário</TableHead>
                                    <TableHead className="font-black text-black dark:text-white uppercase text-xs">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.map((item) => (
                                    <TableRow key={item.id} className="border-b border-black/10 dark:border-white/10 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors">
                                        <TableCell className="font-mono font-bold text-sm">
                                            <div className="flex items-center gap-2">
                                                {item.display_id}
                                                {item.location_confirmed === false && (
                                                    <AlertCircle className="h-4 w-4 text-orange-500" title="Localização não confirmada" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">{item.model || 'N/A'}</TableCell>
                                        <TableCell className="text-xs flex items-center gap-1">
                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                            {item.location_found || item.location || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={getScanMethodBadge(item.scan_method)} 
                                                className={cn(
                                                    "text-[10px] font-bold uppercase rounded-none border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
                                                    item.scan_method === 'qr_code' ? 'bg-green-200 text-green-900' : 'bg-blue-200 text-blue-900'
                                                )}
                                            >
                                                {item.scan_method === 'qr_code' ? 'QR CODE' : 'MANUAL'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(item.counted_at), 'HH:mm', { locale: ptBR })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" onClick={() => setItemToRemove(item.id)} className="h-8 w-8 p-0 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-red-100 hover:bg-red-200 text-red-700 border-red-900">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="border-4 border-black dark:border-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-900 max-w-md">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="font-black uppercase text-xl">Remover Item</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Tem certeza que deseja remover o item "<strong className="bg-yellow-300 px-1 border border-black text-black">{item.display_id}</strong>" da contagem?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="neo-btn bg-white hover:bg-gray-100 text-black border-2 border-black h-10">Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleRemoveItem(item.id)}
                                                            className="neo-btn bg-red-600 hover:bg-red-700 text-white border-2 border-black h-10"
                                                        >
                                                            Remover
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex items-center justify-center h-full min-h-[200px]">
                            <div className="text-center">
                                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground">
                                    {countedItems.length === 0
                                        ? "Nenhum item contado ainda. Use o scanner QR ou adicione manualmente."
                                        : "Nenhum item corresponde aos filtros aplicados."
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
      </div>

      <QRCodeReader
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleScanSuccess}
      />
    </>
  );
};