import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard

export function AdvancedSettings() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const { deleteAllStudents, loading } = useDatabase();

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
    setConfirmationText('');
  };

  const handleConfirmDelete = async () => {
    if (confirmationText !== 'APAGAR TODOS OS ALUNOS') {
      toast({
        title: "Confirmação incorreta",
        description: "Digite exatamente a frase solicitada para confirmar.",
        variant: "destructive",
      });
      return;
    }

    const success = await deleteAllStudents();
    if (success) {
      setIsDeleteModalOpen(false);
      setConfirmationText('');
    }
  };

  const isConfirmationValid = confirmationText === 'APAGAR TODOS OS ALUNOS';

  return (
    <div className="space-y-4">
      <div className="border border-error/20 rounded-lg p-4 bg-error-bg/50 dark:bg-error-bg/70">
        <h3 className="font-semibold text-error-foreground mb-2 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-error" />
          Reiniciar Cadastros de Alunos
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          Esta operação irá apagar permanentemente todos os alunos cadastrados no sistema. 
          Use esta função com cuidado, geralmente no final do ano letivo, antes de importar 
          a nova lista de matrículas. Esta ação não pode ser desfeita.
        </p>
        <Button 
          variant="destructive" 
          onClick={handleDeleteClick}
          className="w-full"
        >
          Apagar Todos os Alunos
        </Button>
      </div>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-modal border-modal-border">
          <DialogHeader>
            <DialogTitle className="text-error flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão Permanente de Todos os Alunos
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <div className="p-3 bg-error-bg border border-error/20 rounded">
                <p className="font-semibold text-error-foreground">
                  Atenção! Esta é uma ação irreversível.
                </p>
                <p className="text-sm text-muted-foreground">
                  Você tem certeza de que deseja apagar todos os registros de alunos do banco de dados?
                </p>
              </div>
              <p className="text-sm font-medium text-foreground">
                Para confirmar, por favor, digite a frase{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs text-foreground">
                  APAGAR TODOS OS ALUNOS
                </code>{" "}
                no campo abaixo.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="confirmation">Confirmação</Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Digite a frase de confirmação"
                className="mt-1 bg-input-bg border-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={!isConfirmationValid || loading}
            >
              {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}