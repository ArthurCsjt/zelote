import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface CancelReservationCallbackOptions {
  onSuccess?: () => void | Promise<void>;
  description?: string;
  deleteFn?: (id: string) => Promise<boolean>;
}

export function useCancelReservation(defaultDeleteFn?: (id: string) => Promise<boolean>) {
  const [isCanceling, setIsCanceling] = useState(false);

  const cancel = useCallback(
    async (
      reservationId: string,
      options?: CancelReservationCallbackOptions
    ): Promise<boolean> => {
      if (isCanceling) return false;

      const deleteFn = options?.deleteFn || defaultDeleteFn;
      if (!deleteFn) {
        console.error('useCancelReservation: Nenhuma função deleteFn fornecida.');
        return false;
      }

      setIsCanceling(true);
      try {
        const success = await deleteFn(reservationId);
        if (success) {
          toast({
            title: 'Reserva cancelada com sucesso',
            description: options?.description,
            variant: 'success',
          });
          if (options?.onSuccess) {
            await options.onSuccess();
          }
          return true;
        } else {
          toast({
            title: 'Erro ao cancelar reserva',
            description: 'Não foi possível cancelar no momento. Tente novamente.',
            variant: 'destructive',
          });
          return false;
        }
      } catch (error) {
        console.error('Exceção ao cancelar reserva:', error);
        toast({
          title: 'Erro ao cancelar reserva',
          description: 'Não foi possível cancelar no momento. Tente novamente.',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsCanceling(false);
      }
    },
    [isCanceling, defaultDeleteFn]
  );

  return {
    cancel,
    isCanceling,
  };
}

