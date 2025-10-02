import { useState } from 'react';
import { useInventoryAudit } from '@/hooks/inventory/useInventoryAudit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QRCodeReader } from '@/components/QRCodeReader';
import { Loader2, QrCode, ClipboardCheck } from 'lucide-react';

export const AuditScanner = () => {
  const { activeAudit, countedItems, countItem, completeAudit, isProcessing } = useInventoryAudit();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // NOSSO DETETIVE
  console.log('[AuditScanner] Renderizando... Auditoria ativa?', activeAudit);

  const handleScanSuccess = (scannedData: string) => {
    countItem(scannedData, 'qr_code');
    setIsScannerOpen(false);
  };

  if (!activeAudit) {
    return <p>Erro: Nenhuma auditoria ativa encontrada.</p>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Contagem em Andamento</CardTitle>
          <CardDescription>
            Escaneie os QR Codes dos Chromebooks. Os itens contados aparecerão na lista abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button onClick={() => setIsScannerOpen(true)} size="lg" className="flex-1">
              <QrCode className="mr-2 h-5 w-5" />
              Escanear Item (QR Code)
            </Button>
            <Button onClick={completeAudit} size="lg" variant="secondary" className="flex-1" disabled={isProcessing}>
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
                    <li key={item.id} className="text-sm p-1">
                      Item ID: ...{String(item.chromebook_id).slice(-6)} (Contado em: {new Date(item.counted_at).toLocaleTimeString()})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center pt-4">
                  Nenhum item escaneado ainda.
                </p>
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