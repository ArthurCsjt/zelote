import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserType } from '@/types/database';
import { searchUsersServer } from '@/services/userService';
import logger from '@/utils/logger';

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  ra?: string;
  turma?: string;
  materia?: string | null;
  type: UserType;
  searchable: string;
}

const fetchAllUsers = async (): Promise<UserSearchResult[]> => {
  const [
    { data: alunos, error: alunosError },
    { data: professores, error: professoresError },
    { data: funcionarios, error: funcionariosError },
  ] = await Promise.all([
    supabase.from('alunos').select('id, nome_completo, ra, email, turma').limit(1000),
    supabase.from('professores').select('id, nome_completo, email, materia').limit(500),
    supabase.from('funcionarios').select('id, nome_completo, email').limit(500),
  ]);

  if (alunosError || professoresError || funcionariosError) {
    logger.error('Erro ao buscar lista de usuários:', { alunosError, professoresError, funcionariosError });
    throw new Error('Erro ao carregar dados de usuários.');
  }

  const allUsers: UserSearchResult[] = [];

  (alunos || []).forEach(a => {
    const searchable = `${a.nome_completo} ${a.ra} ${a.email} ${a.turma} aluno`.toLowerCase();
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
    const searchable = `${p.nome_completo} ${p.email} ${p.materia || ''} professor`.toLowerCase();
    allUsers.push({
      id: p.id,
      name: p.nome_completo,
      email: p.email,
      materia: p.materia,
      type: 'professor',
      searchable,
    });
  });

  (funcionarios || []).forEach(f => {
    const searchable = `${f.nome_completo} ${f.email} funcionario`.toLowerCase();
    allUsers.push({
      id: f.id,
      name: f.nome_completo,
      email: f.email,
      type: 'funcionario',
      searchable,
    });
  });

  return allUsers;
};

export function useUserSearch() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users-search-list'],
    queryFn: fetchAllUsers,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache compartilhado global
    gcTime: 1000 * 60 * 15,
  });

  const fetchUsers = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    users,
    loading: isLoading,
    fetchUsers,
    searchUsersServer,
  };
}