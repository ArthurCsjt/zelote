import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useDatabase } from '@/hooks/useDatabase';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook centralizado para controle de acesso ao agendamento.
 * Autoridade:
 * 1. Qualquer admin ou super_admin tem autoridade nativa automática.
 * 2. Qualquer e-mail cadastrado na tabela system_settings ('scheduling_responsible_emails')
 *    tem permissão de coordenador/responsável pelo agendamento.
 */
export function useSchedulingResponsible() {
  const { user } = useAuth();
  const { isAdmin, role } = useProfileRole();
  const isSuperAdmin = role === 'super_admin';
  const { getSystemSetting } = useDatabase();

  const { data: dbResponsibleEmails = [], refetch } = useQuery<string[]>({
    queryKey: ['system-setting', 'scheduling_responsible_emails'],
    queryFn: async () => {
      const result = await getSystemSetting('scheduling_responsible_emails', []);
      return Array.isArray(result) ? result : [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const isResponsible = useMemo(() => {
    // 1. Administradores e Super Admins sempre possuem acesso total
    if (isAdmin || isSuperAdmin) return true;

    // 2. Se o e-mail do usuário logado constar na lista configurada no banco
    if (user?.email && Array.isArray(dbResponsibleEmails)) {
      return dbResponsibleEmails.includes(user.email.toLowerCase());
    }

    return false;
  }, [isAdmin, isSuperAdmin, user?.email, dbResponsibleEmails]);

  return {
    isResponsible,
    isAdmin,
    isSuperAdmin,
    responsibleEmails: dbResponsibleEmails,
    refetchResponsible: refetch,
  };
}
