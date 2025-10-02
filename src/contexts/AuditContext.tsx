import { createContext, useContext, ReactNode } from 'react';
import { useInventoryAudit } from '@/hooks/inventory/useInventoryAudit';

// Usamos 'ReturnType' para pegar o tipo exato do que o nosso hook retorna
type AuditContextType = ReturnType<typeof useInventoryAudit>;

// Criamos o contexto
const AuditContext = createContext<AuditContextType | undefined>(undefined);

// Criamos o Provedor, que vai conter toda a lógica
export const AuditProvider = ({ children }: { children: ReactNode }) => {
  const auditStateAndFunctions = useInventoryAudit();
  return (
    <AuditContext.Provider value={auditStateAndFunctions}>
      {children}
    </AuditContext.Provider>
  );
};

// Criamos um hook customizado para consumir o contexto facilmente
export const useAudit = () => {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAudit deve ser usado dentro de um AuditProvider');
  }
  return context;
};