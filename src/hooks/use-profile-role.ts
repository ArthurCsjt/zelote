import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/utils/logger';

export type ProfileRole = 'admin' | 'user' | 'super_admin' | 'professor' | 'teacher' | 'manutencao' | null;

export function useProfileRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<ProfileRole>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadRole = async () => {
      try {
        if (!user?.id) {
          if (isMounted) {
            setRole(null);
            setLoading(false);
          }
          return;
        }

        // ALTERAÇÃO: Usando a função RPC get_my_role() para buscar o papel
        // Esta função é mais robusta, pois é executada com SECURITY DEFINER no banco.
        const { data, error } = await supabase.rpc('get_my_role');

        if (error) throw error;

        if (isMounted) {
          // O RPC retorna a role como uma string (text)
          let fetchedRole = (data as ProfileRole) ?? 'user';
          
          // Auto-assign 'manutencao' role based on specific emails
          const email = user.email?.toLowerCase();
          if (
            email === 'paulo.geremias@colegiosaojudas.com.br' || 
            email === 'ivo@colegiosaojudas.com.br' || 
            email === 'manutencao.teste@colegiosaojudas.com.br'
          ) {
            fetchedRole = 'manutencao';
          }
          
          logger.debug(`User ID: ${user.id}, Fetched Role: ${fetchedRole}`);
          setRole(fetchedRole);
        }
      } catch (e) {
        logger.error('Erro ao carregar função do perfil', e);
        // Se houver erro, assume 'user' para evitar que o app trave
        if (isMounted) setRole('user');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRole();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const isAdmin = role === 'admin' || role === 'super_admin';

  return {
    role,
    isAdmin,
    loading,
  };
}