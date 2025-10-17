import { useState, useEffect, useCallback } from 'react';
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

// O hook agora aceita um termo de pesquisa
export function useUserSearch(searchTerm: string) {
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Normaliza o termo de pesquisa para uso no Supabase (ilike)
  const searchPattern = searchTerm ? `%${searchTerm.toLowerCase()}%` : '%%';
  const limit = 50; // Limite de resultados para evitar sobrecarga

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Define a condição de busca para todas as tabelas
      const searchCondition = `nome_completo.ilike.${searchPattern},email.ilike.${searchPattern}`;
      const alunoSearchCondition = `${searchCondition},ra.ilike.${searchPattern},turma.ilike.${searchPattern}`;

      const [
        { data: alunos, error: alunosError },
        { data: professores, error: professoresError },
        { data: funcionarios, error: funcionariosError },
      ] = await Promise.all([
        supabase.from('alunos').select('id, nome_completo, ra, email, turma').or(alunoSearchCondition).limit(limit),
        supabase.from('professores').select('id, nome_completo, email').or(searchCondition).limit(limit),
        supabase.from('funcionarios').select('id, nome_completo, email').or(searchCondition).limit(limit),
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

      // Remove duplicatas (se houver) e limita o total
      const uniqueUsers = Array.from(new Map(allUsers.map(user => [user.id, user])).values()).slice(0, limit);
      
      setUsers(uniqueUsers);
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
  }, [searchPattern]); // Depende apenas do searchPattern

  useEffect(() => {
    // Só busca se houver pelo menos 2 caracteres ou se o termo estiver vazio (para carregar a lista inicial, se necessário)
    if (searchTerm.length >= 2 || searchTerm.length === 0) {
        fetchUsers();
    } else {
        setUsers([]);
    }
  }, [searchTerm, fetchUsers]);

  return { users, loading, fetchUsers };
}