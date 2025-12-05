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
import { toast } from '@/hooks/use-toast';
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
      <DialogContent className="sm:max-w-md border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] rounded-none sm:rounded-none bg-white dark:bg-zinc-900 overflow-hidden">
        <DialogHeader className="bg-yellow-300 dark:bg-yellow-900/50 p-6 border-b-4 border-black dark:border-white">
          <DialogTitle className="text-destructive flex items-center gap-2 font-black uppercase text-xl">
            <Trash2 className="h-6 w-6 text-red-600" />
            <span className="text-black dark:text-white">Confirmar Exclusão</span>
          </DialogTitle>
          <DialogDescription className="text-black/70 dark:text-white/70 font-bold text-xs uppercase tracking-wide mt-2">
            Tem certeza que deseja excluir o Chromebook <span className="bg-white dark:bg-black px-1 border border-black dark:border-white text-black dark:text-white">{chromebook?.patrimony_number || chromebook?.chromebook_id}</span>?
            <br /><br />
            <span className="text-red-600 font-bold uppercase">Esta ação não pode ser desfeita.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="p-6 bg-white dark:bg-zinc-900">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white font-bold uppercase text-xs"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs"
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