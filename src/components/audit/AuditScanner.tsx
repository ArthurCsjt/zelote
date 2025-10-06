import { useState } from 'react';
import { useAudit } from '@/contexts/AuditContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QRCodeReader } from '@/components/QRCodeReader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode, ClipboardCheck, PlusCircle, Trash2, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
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

export const AuditScanner = () => {
  const { activeAudit, countedItems, filteredItems, countItem, completeAudit, removeItem, isProcessing } = useAudit();
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Contagem: {activeAudit.audit_name}
          </CardTitle>
          <CardDescription>
            Digite o ID do Chromebook ou escaneie o QR Code. Os itens contados aparecerão na lista abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="manual-id">Adicionar ID Manualmente</Label>
              <div className="flex space-x-2">
                <Input
                  id="manual-id"
                  placeholder="Digite o ID do Chromebook"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddManualId()}
                  autoComplete="off"
                />
                <Button onClick={handleAddManualId} disabled={!manualId.trim() || isProcessing}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </div>
            </div>
            <Button onClick={() => setIsScannerOpen(true)} size="lg" className="w-full">
              <QrCode className="mr-2 h-5 w-5" />
              Escanear Item (QR Code)
            </Button>
            <Button onClick={completeAudit} size="lg" variant="secondary" className="w-full" disabled={isProcessing || countedItems.length === 0}>
              {isProcessing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ClipboardCheck className="mr-2 h-5 w-5" />
              )}
              Finalizar Contagem ({countedItems.length} itens)
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Itens Contados: {filteredItems.length}
                {filteredItems.length !== countedItems.length && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (filtrados de {countedItems.length})
                  </span>
                )}
              </h3>
              {countedItems.length > 0 && (
                <Badge variant="outline">
                  {Math.round((countedItems.length / Math.max(countedItems.length, 1)) * 100)}% concluído
                </Badge>
              )}
            </div>

            <ScrollArea className="h-96 w-full rounded-md border">
              {filteredItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {item.display_id}
                            {item.location_confirmed === false && (
                              <AlertCircle className="h-4 w-4 text-orange-500" title="Localização não confirmada" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.model || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location || 'Não informado'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(item.status)}>
                            {item.status || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getScanMethodBadge(item.scan_method)}>
                            {item.scan_method === 'qr_code' ? 'QR' : 'Manual'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(item.counted_at), 'HH:mm', { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setItemToRemove(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover o item "{item.display_id}" da contagem?
                                  Esta ação não pode ser desfeita.
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
          </div>
        </CardContent>
      </Card>

      <QRCodeReader
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleScanSuccess}
      />
    </>
  );
};