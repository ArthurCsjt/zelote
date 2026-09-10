import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/utils/logger';

export type ProfileRole = 'admin' | 'user' | 'super_admin' | 'professor' | 'teacher' | 'manutencao' | null;

// Cache em memória compartilhado entre todas as instâncias do hook na aplicação
let memoryRoleCache: { userId: string; role: ProfileRole } | null = null;
let pendingRolePromise: Promise<ProfileRole> | null = null;

const getCachedRole = (userId?: string): ProfileRole | null => {
  if (!userId) return null;
  if (memoryRoleCache && memoryRoleCache.userId === userId) {
    return memoryRoleCache.role;
  }
  try {
    const cached = sessionStorage.getItem(`zelote_role_${userId}`);
    if (cached) {
      memoryRoleCache = { userId, role: cached as ProfileRole };
      return cached as ProfileRole;
    }
  } catch (e) {}
  return null;
};

const setCachedRole = (userId: string, role: ProfileRole) => {
  memoryRoleCache = { userId, role };
  try {
    if (role) {
      sessionStorage.setItem(`zelote_role_${userId}`, role);
    } else {
      sessionStorage.removeItem(`zelote_role_${userId}`);
    }
  } catch (e) {}
};

export function useProfileRole() {
  const { user } = useAuth();
  const userId = user?.id;
  const cached = getCachedRole(userId);

  const [role, setRole] = useState<ProfileRole>(cached);
  const [loading, setLoading] = useState<boolean>(!cached && !!userId);

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      setRole(null);
      setLoading(false);
      return;
    }

    // Se já temos cache, atualiza o estado local imediatamente
    const currentCached = getCachedRole(userId);
    if (currentCached) {
      setRole(currentCached);
      setLoading(false);
    }

    const fetchRole = async (): Promise<ProfileRole> => {
      // Reutiliza requisição em andamento para evitar chamadas RPC concorrentes múltiplas
      if (pendingRolePromise) {
        return pendingRolePromise;
      }

      pendingRolePromise = (async () => {
        try {
          const { data, error } = await supabase.rpc('get_my_role');
          if (error) throw error;
          const fetchedRole = (data as ProfileRole) ?? 'user';
          setCachedRole(userId, fetchedRole);
          return fetchedRole;
        } catch (e) {
          logger.error('Erro ao carregar função do perfil', e);
          const fallbackRole = currentCached || 'user';
          setCachedRole(userId, fallbackRole);
          return fallbackRole;
        } finally {
          pendingRolePromise = null;
        }
      })();

      return pendingRolePromise;
    };

    fetchRole().then((fetchedRole) => {
      if (isMounted) {
        setRole(fetchedRole);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const isAdmin = role === 'admin' || role === 'super_admin';

  return {
    role,
    isAdmin,
    loading,
  };
}