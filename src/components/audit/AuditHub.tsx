import { useState } from 'react';
import { useInventoryAudit } from '@/hooks/inventory/useInventoryAudit';
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
import { Loader2 } from 'lucide-react';
import { AuditScanner } from './AuditScanner'; // <-- Importamos o novo componente

export const AuditHub = () => {
  const { activeAudit, startAudit, isProcessing } = useInventoryAudit();
  const [newAuditName, setNewAuditName] = useState('');

  const handleStartAudit = () => {
    if (newAuditName.trim()) {
      startAudit(newAuditName.trim());
    }
  };

  // Se uma auditoria estiver ativa, mostramos a tela de scanner.
  // Senão, mostramos a tela para iniciar uma nova.
  if (activeAudit) {
    return <AuditScanner />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sistema de Contagem de Inventário</CardTitle>
        <CardDescription>
          Inicie uma nova contagem para auditar o inventário físico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Nenhuma contagem em andamento. Inicie uma para começar a escanear os itens.
          </p>
          <AlertDialog onOpenChange={(open) => !open && setNewAuditName('')}>
            <AlertDialogTrigger asChild>
              <Button disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Nova Contagem
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Iniciar Nova Contagem</AlertDialogTitle>
                <AlertDialogDescription>
                  Dê um nome para esta sessão de auditoria para fácil identificação.
                  Ex: "Contagem Mensal - Outubro"
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="audit-name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="audit-name"
                    value={newAuditName}
                    onChange={(e) => setNewAuditName(e.target.value)}
                    className="col-span-3"
                    placeholder="Contagem Semanal"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleStartAudit} disabled={!newAuditName.trim()}>
                  Confirmar e Iniciar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};