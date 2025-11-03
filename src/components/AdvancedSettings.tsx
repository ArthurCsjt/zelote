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
      <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5 dark:bg-destructive/10 dark:border-destructive/50">
        <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Reiniciar Cadastros de Alunos
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
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
        <DialogContent className="sm:max-w-[425px] dark:bg-card dark:border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Confirmar Exclusão Permanente de Todos os Alunos
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded dark:bg-destructive/20 dark:border-destructive/50">
                <p className="font-semibold text-destructive">
                  Atenção! Esta é uma ação irreversível.
                </p>
                <p className="text-sm text-muted-foreground">
                  Você tem certeza de que deseja apagar todos os registros de alunos do banco de dados?
                </p>
              </div>
              <p className="text-sm font-medium dark:text-foreground">
                Para confirmar, por favor, digite a frase{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs dark:bg-gray-700 dark:text-gray-200">
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
                className="mt-1 dark:bg-input dark:border-border"
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