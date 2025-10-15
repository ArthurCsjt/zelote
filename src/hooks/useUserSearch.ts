import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { UserType } from '@/types/database';

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  ra?: string;
  turma?: string;
  type: UserType;
  searchable: string;
}

export function useUserSearch() {
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: alunos, error: alunosError },
        { data: professores, error: professoresError },
        { data: funcionarios, error: funcionariosError },
      ] = await Promise.all([
        supabase.from('alunos').select('id, nome_completo, ra, email, turma'),
        supabase.from('professores').select('id, nome_completo, email'),
        supabase.from('funcionarios').select('id, nome_completo, email'),
      ]);

      if (alunosError || professoresError || funcionariosError) {
        throw new Error('Erro ao carregar dados de usuários.');
      }

      const allUsers: UserSearchResult[] = [];

      (alunos || []).forEach(a => {
        const searchable = `${a.nome_completo} ${a.ra} ${a.email} ${a.turma}`.toLowerCase();
        allUsers.push({
          id: a.id,
          name: a.nome_completo,
          email: a.email,
          ra: a.ra,
          turma: a.turma,
          type: 'aluno',
          searchable,
        });
      });

      (professores || []).forEach(p => {
        const searchable = `${p.nome_completo} ${p.email}`.toLowerCase();
        allUsers.push({
          id: p.id,
          name: p.nome_completo,
          email: p.email,
          type: 'professor',
          searchable,
        });
      });

      (funcionarios || []).forEach(f => {
        const searchable = `${f.nome_completo} ${f.email}`.toLowerCase();
        allUsers.push({
          id: f.id,
          name: f.nome_completo,
          email: f.email,
          type: 'funcionario',
          searchable,
        });
      });

      setUsers(allUsers);
    } catch (e: any) {
      console.error('Erro no useUserSearch:', e);
      toast({
        title: 'Erro de Sincronização',
        description: 'Não foi possível carregar a lista de usuários para autocompletar.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, fetchUsers };
}