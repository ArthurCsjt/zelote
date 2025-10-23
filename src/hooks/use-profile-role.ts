import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ProfileRole = 'admin' | 'user' | 'super_admin' | null;

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
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (isMounted) {
          const fetchedRole = (data?.role as ProfileRole) ?? null;
          console.log(`[useProfileRole] User ID: ${user.id}, Fetched Role: ${fetchedRole}`); // DEBUG LOG
          setRole(fetchedRole);
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
  console.log(`[useProfileRole] Current Role: ${role}, Is Admin: ${isAdmin}, Loading: ${loading}`); // DEBUG LOG

  return {
    role,
    isAdmin,
    loading,
  };
}