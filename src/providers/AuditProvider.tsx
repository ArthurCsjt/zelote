import { ReactNode } from 'react';
import { AuditContext } from '@/contexts/AuditContext';

export const AuditProvider = ({ children }: { children: ReactNode }) => {
  const value = {};
  return (
    <AuditContext.Provider value={value}>
      {children}
    </AuditContext.Provider>
  );
};
