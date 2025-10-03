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
import { Loader2 } from 'lucide-react';
import { AuditScanner } from './AuditScanner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AuditHub = () => {
  const { activeAudit, completedAudits, startAudit, isProcessing } = useAudit();
  const [newAuditName, setNewAuditName] = useState('');

  const handleStartAudit = () => {
    if (newAuditName.trim()) {
      startAudit(newAuditName.trim());
      setNewAuditName('');
    }
  };

  if (activeAudit) {
    return <AuditScanner />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Iniciar Contagem</CardTitle>
          <CardDescription>
            Comece uma nova sessão de contagem de inventário.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Contagens</CardTitle>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma contagem concluída para exibir.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};