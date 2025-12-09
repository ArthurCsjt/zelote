import { ReactNode } from 'react';
import { AuditContext } from '@/contexts/AuditContext';
import { useInventoryAudit } from '@/hooks/inventory/useInventoryAudit_clean';

export const AuditProvider = ({ children }: { children: ReactNode }) => {
  const auditStateAndFunctions = useInventoryAudit();
  return (
    <AuditContext.Provider value={auditStateAndFunctions}>
      {children}
    </AuditContext.Provider>
  );
};