import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, QrCode, Plus, CheckCircle, AlertCircle, Monitor, Factory, Hash, Clock, ListChecks } from 'lucide-react';
import { QRCodeReader } from '@/components/QRCodeReader';
import { GlassCard } from '@/components/ui/GlassCard';
import { useSmartRegistration, RegisteredItem } from '@/hooks/useSmartRegistration';
import { sanitizeQRCodeData, normalizeChromebookId } from '@/utils/security';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SmartRegistrationProps {
  onBack: () => void;
}

export function SmartRegistration({ onBack }: SmartRegistrationProps) {
  const { isProcessing, registeredItems, registerFromQRCode, registerFromManualId } = useSmartRegistration();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [manualId, setManualId] = useState('');

  const handleScanSuccess = (scannedData: string) => {
    setIsScannerOpen(false);
    
    const result = sanitizeQRCodeData(scannedData);
    
    if (typeof result === 'object' && result.id) {
      // Novo formato JSON (Cadastro Inteligente)
      registerFromQRCode(result);
    } else if (typeof result === 'string' && result) {
      // Formato de ID simples (Cadastro Manual Alternativo)
      registerFromManualId(result);
    } else {
      toast({
        title: "Erro de Leitura",
        description: "O QR Code não contém dados válidos ou um ID reconhecível.",
        variant: "destructive",
      });
    }
  };

  const handleAddManualId = () => {
    if (manualId.trim()) {
      const normalizedId = normalizeChromebookId(manualId.trim());
      registerFromManualId(normalizedId);
      setManualId('');
    }
  };
  
  const getStatusBadge = (status: RegisteredItem['status']) => {
    switch (status) {
      case 'disponivel':
        return 'default';
      case 'fora_uso':
        return 'destructive';
      case 'fixo':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <ListChecks className="h-7 w-7 text-menu-teal" />
          Cadastro Inteligente de Inventário
        </h1>
        <p className="text-muted-foreground">Reconstrua o inventário escaneando QR Codes detalhados.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Coluna 1: Ações de Cadastro */}
        <GlassCard className="border-green-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <QrCode className="h-5 w-5" />
              Escanear e Cadastrar
            </CardTitle>
            <CardDescription>
              Use o QR Code para ler automaticamente todos os detalhes do equipamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Botão Escanear QR Code (Ação Primária) */}
            <Button 
              onClick={() => setIsScannerOpen(true)} 
              size="lg" 
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  <QrCode className="mr-2 h-5 w-5" />
                  Escanear QR Code
                </>
              )}
            </Button>
            
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-300" />
              <span className="flex-shrink mx-4 text-gray-500 text-sm">OU</span>
              <div className="flex-grow border-t border-gray-300" />
            </div>

            {/* Entrada Manual (Alternativa) */}
            <div className="space-y-2">
              <Label htmlFor="manual-id">Entrada Manual (Apenas ID)</Label>
              <div className="flex space-x-2">
                <Input
                  id="manual-id"
                  placeholder="Digite o ID (ex: 12 ou CHR012)"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddManualId()}
                  autoComplete="off"
                  className="flex-1"
                  disabled={isProcessing}
                />
                <Button 
                  onClick={handleAddManualId} 
                  disabled={!manualId.trim() || isProcessing} 
                  size="sm"
                  variant="secondary"
                  className="h-10"
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                O cadastro manual usará valores padrão para modelo e série.
              </p>
            </div>
          </CardContent>
        </GlassCard>
        
        {/* Coluna 2: Feedback em Tempo Real */}
        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Itens Cadastrados na Sessão ({registeredItems.length})
            </CardTitle>
            <CardDescription>
              Lista de Chromebooks adicionados desde o início desta sessão.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96 w-full rounded-md border">
              {registeredItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registeredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-sm">{item.chromebook_id}</TableCell>
                        <TableCell className="text-xs">{item.model}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(item.status)} className="capitalize">
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={item.source === 'qr_code' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}>
                            {item.source === 'qr_code' ? 'QR Code' : 'Manual'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(item.timestamp), 'HH:mm:ss', { locale: ptBR })}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[300px]">
                  <div className="text-center p-4">
                    <Monitor className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Comece a escanear para reconstruir o inventário.
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </GlassCard>
      </div>

      <QRCodeReader
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleScanSuccess}
      />
    </div>
  );
}