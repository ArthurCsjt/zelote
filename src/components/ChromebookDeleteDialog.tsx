import React from 'react';
import { Button } from "./ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "./ui/dialog";
import { Trash2, Loader2 } from "lucide-react";
import { useDatabase } from '@/hooks/useDatabase';
import { toast } from './ui/use-toast';
import type { Chromebook } from "@/types/database";

interface ChromebookDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chromebook: Chromebook | null;
  onDeleteSuccess: () => void;
}

export function ChromebookDeleteDialog({ open, onOpenChange, chromebook, onDeleteSuccess }: ChromebookDeleteDialogProps) {
  const { deleteChromebook, loading: isDeleting } = useDatabase();

  const handleConfirmDelete = async () => {
    if (!chromebook) return;

    const success = await deleteChromebook(chromebook.id);

    if (success) {
      onDeleteSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o Chromebook <strong>{chromebook?.patrimony_number || chromebook?.chromebook_id}</strong>?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}