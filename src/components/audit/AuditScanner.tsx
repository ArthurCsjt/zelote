import { useState } from 'react';
import { useAudit } from '@/contexts/AuditContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QRCodeReader } from '@/components/QRCodeReader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode, ClipboardCheck, PlusCircle, Trash2, Clock, CheckCircle, AlertCircle, Monitor, MapPin, ListChecks } from 'lucide-react';
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
        
        {/* Painel de Contagem (Foco Principal) */}
        <GlassCard className="border-menu-teal/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-menu-teal">
              <QrCode className="h-5 w-5" />
              Contagem Ativa: {activeAudit.audit_name}
            </CardTitle>
            <CardDescription>
              Escaneie ou digite o ID do Chromebook.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              
              {/* Botão de Scanner (Destaque) */}
              <Button onClick={() => setIsScannerOpen(true)} size="lg" className="w-full bg-menu-teal hover:bg-menu-teal-hover">
                <QrCode className="mr-2 h-5 w-5" />
                Escanear Item (QR Code)
              </Button>
              
              {/* Entrada Manual */}
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="manual-id">Adicionar ID Manualmente</Label>
                <div className="flex space-x-2">
                  <Input
                    id="manual-id"
                    placeholder="Digite o ID, Patrimônio ou Série"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddManualId()}
                    autoComplete="off"
                  />
                  <Button onClick={handleAddManualId} disabled={!manualId.trim() || isProcessing} variant="secondary">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Botão de Finalizar */}
              <Button onClick={completeAudit} size="lg" variant="destructive" className="w-full mt-4" disabled={isProcessing || countedItems.length === 0}>
                {isProcessing ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <ClipboardCheck className="mr-2 h-5 w-5" />
                )}
                Finalizar Contagem ({countedItems.length} itens)
              </Button>
            </div>
          </CardContent>
        </GlassCard>
        
        {/* Painel de Itens Faltantes (movido para o topo para visibilidade) */}
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
                
                {/* Grid de cards de métricas (simplificado) */}
                <GlassCard>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Métricas Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                        <Card className="shadow-sm p-3">
                            <div className="text-xl font-semibold text-foreground">{inventoryStats?.total ?? totalExpected}</div>
                            <div className="text-xs text-muted-foreground mt-1">Total Esperado</div>
                        </Card>
                        <Card className="shadow-sm p-3">
                            <div className="text-xl font-semibold text-green-600">{countedItems.length}</div>
                            <div className="text-xs text-muted-foreground mt-1">Itens Contados</div>
                        </Card>
                        <Card className="shadow-sm p-3">
                            <div className="text-xl font-semibold text-red-600">{missingItems.length}</div>
                            <div className="text-xs text-muted-foreground mt-1">Faltantes</div>
                        </Card>
                        <Card className="shadow-sm p-3">
                            <div className="text-xl font-semibold text-blue-600">
                                {totalExpected > 0
                                    ? Math.round((countedItems.length / totalExpected) * 100)
                                    : 0}%
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">Conclusão</div>
                        </Card>
                    </CardContent>
                </GlassCard>
            </div>
            
            {/* Coluna da Tabela de Itens Contados */}
            <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ListChecks className="h-5 w-5" />
                        Itens Contados ({filteredItems.length})
                    </CardTitle>
                    <CardDescription>
                        Lista de todos os itens registrados nesta auditoria.
                    </CardDescription>
                </CardHeader>
                <ScrollArea className="h-[400px] w-full border-t">
                    {filteredItems.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Modelo</TableHead>
                                    <TableHead>Localização</TableHead>
                                    <TableHead>Método</TableHead>
                                    <TableHead>Horário</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium text-sm">
                                            <div className="flex items-center gap-2">
                                                {item.display_id}
                                                {item.location_confirmed === false && (
                                                    <AlertCircle className="h-4 w-4 text-orange-500" title="Localização não confirmada" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">{item.model || 'N/A'}</TableCell>
                                        <TableCell className="text-xs flex items-center gap-1">
                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                            {item.location_found || item.location || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getScanMethodBadge(item.scan_method)} className="text-[10px]">
                                                {item.scan_method === 'qr_code' ? 'QR' : 'Manual'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(item.counted_at), 'HH:mm', { locale: ptBR })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" onClick={() => setItemToRemove(item.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Remover Item</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Tem certeza que deseja remover o item "{item.display_id}" da contagem?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleRemoveItem(item.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
            </GlassCard>
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