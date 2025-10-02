import { useAudit } from '@/contexts/AuditContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const AuditScanner = () => {
  // Apenas pegamos o estado do hook compartilhado
  const { activeAudit } = useAudit();

  console.log('[AuditScanner SIMPLIFICADO] Renderizando... Auditoria ativa?', activeAudit);

  // Se por algum motivo o estado ainda for nulo, mostramos uma mensagem de espera
  if (!activeAudit) {
    return <p>Aguardando dados da auditoria...</p>;
  }

  // Apenas tentamos renderizar o nome da auditoria. Nada mais.
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teste de Auditoria Ativa</CardTitle>
      </CardHeader>
      <CardContent>
        <p>O nome da auditoria ativa é: <strong>{activeAudit.audit_name}</strong></p>
      </CardContent>
    </Card>
  );
};