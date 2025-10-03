import { useState } from 'react';
import { useAudit } from '@/contexts/AuditContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QRCodeReader } from '@/components/QRCodeReader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode, ClipboardCheck, PlusCircle } from 'lucide-react';

export const AuditScanner = () => {
  const { activeAudit, countedItems, countItem, completeAudit, isProcessing } = useAudit();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [manualId, setManualId] = useState('');

  const handleScanSuccess = (scannedData: string) => {
    countItem(scannedData, 'qr_code');
    setIsScannerOpen(false);
  };

  const handleAddManualId = () => {
    if (manualId.trim()) {
      countItem(manualId.trim(), 'manual');
      setManualId('');
    }
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
          <CardTitle>Contagem: {activeAudit.audit_name}</CardTitle>
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
              Finalizar Contagem
            </Button>
          </div>
          <div>
            <h3 className="font-semibold mb-2">
              Itens Contados: {countedItems.length}
            </h3>
            <ScrollArea className="h-48 w-full rounded-md border p-2">
              {countedItems.length > 0 ? (
                <ul>
                  {countedItems.map((item) => (
                    <li key={item.id} className="text-sm p-1.5 border-b last:border-b-0">
                      {/* ALTERAÇÃO: Exibindo apenas o ID */}
                      ID: {item.display_id || item.chromebook_id}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground text-center pt-4">
                    Nenhum item contado ainda.
                  </p>
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