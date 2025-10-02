import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
// 1. REMOVEMOS a importação do useAuth
// import { useAuth } from '@/contexts/AuthContext'; 
import type { User } from '@supabase/supabase-js'; // Importamos o tipo User

export type ProfileRole = 'admin' | 'user' | 'super_admin' | null;

// 2. A FUNÇÃO AGORA RECEBE o 'user' como um argumento
export function useProfileRole(user: User | null) {
  // 3. REMOVEMOS a chamada interna do useAuth
  // const { user } = useAuth();
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
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (isMounted) {
          setRole((data?.role as ProfileRole) ?? null);
        }
      } catch (e) {
        console.error('Erro ao carregar função do perfil:', e);
        if (isMounted) setRole(null);
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