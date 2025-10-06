import { createContext, useContext } from 'react';

type AuditContextType = {
  // Placeholder para evitar erros de build
};

export const AuditContext = createContext<AuditContextType | undefined>(undefined);

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAudit deve ser usado dentro de um AuditProvider');
  }
  return context;
};
