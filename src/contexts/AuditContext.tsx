import { createContext, useContext } from 'react';
import { useInventoryAudit } from '@/hooks/inventory/useInventoryAudit_clean';

type AuditContextType = ReturnType<typeof useInventoryAudit>;

export const AuditContext = createContext<AuditContextType | undefined>(undefined);

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAudit deve ser usado dentro de um AuditProvider');
  }
  return context;
};