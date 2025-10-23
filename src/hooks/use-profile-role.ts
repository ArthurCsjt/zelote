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
        
        // 1. Tenta buscar o perfil existente
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        let currentRole: ProfileRole = (data?.role as ProfileRole) ?? null;

        // 2. Se o perfil não existir, tenta criá-lo (fallback para o trigger)
        if (!data) {
            const isSuperAdminEmail = user.email === 'arthur.alencar@colegiosaojudas.com.br';
            const newRole = isSuperAdminEmail ? 'super_admin' : 'user';
            
            const { error: insertError } = await supabase
                .from('profiles')
                .insert({ id: user.id, email: user.email!, role: newRole })
                .select('role')
                .single();
            
            if (insertError) {
                console.error('Erro ao criar perfil fallback:', insertError);
                currentRole = 'user'; // Assume user se falhar
            } else {
                currentRole = newRole;
            }
        }
        
        // 3. Garante que o super admin tenha a role correta, mesmo que o trigger falhe
        if (user.email === 'arthur.alencar@colegiosaojudas.com.br' && currentRole !== 'super_admin') {
             const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: 'super_admin' })
                .eq('id', user.id);
            
            if (!updateError) {
                currentRole = 'super_admin';
            }
        }


        if (isMounted) {
          setRole(currentRole);
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
  }, [user?.id, user?.email]);

  const isAdmin = role === 'admin' || role === 'super_admin';

  return {
    role,
    isAdmin,
    loading,
  };
}