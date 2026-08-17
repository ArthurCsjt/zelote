import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { getUserTypeFromEmail, isStudentEmail } from '@/utils/emailValidation';
import logger from '@/utils/logger';

/**
 * Garante que um usuário autenticado (Professor ou Funcionário)
 * tenha automaticamente um registro correspondente na tabela operacional do inventário.
 * 
 * Alunos (@sj.g12.br) são ignorados por esta função pois não têm permissão de acesso ao sistema.
 */
export async function syncUserToInventory(user: User): Promise<void> {
  if (!user || !user.email) return;

  const email = user.email.trim().toLowerCase();

  // 1. Alunos são expressamente bloqueados de login/sincronização automática
  if (isStudentEmail(email)) {
    logger.warn(`Sincronização de inventário ignorada para conta de aluno: ${email}`);
    return;
  }

  try {
    // 2. Tenta identificar o tipo pelo e-mail ou metadata
    const detectedType = getUserTypeFromEmail(email);

    // 3. Determina o nome do usuário a partir dos metadados ou do e-mail
    const meta = user.user_metadata || {};
    let fullName = (meta.full_name || meta.name || '').trim();

    if (!fullName && meta.first_name) {
      fullName = `${meta.first_name} ${meta.last_name || ''}`.trim();
    }

    // Se ainda não houver nome, formata o prefixo do e-mail (ex: wallace.ribas -> Wallace Ribas)
    if (!fullName) {
      const emailPrefix = email.split('@')[0];
      fullName = emailPrefix
        .split(/[\._\-]/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }

    if (!fullName) {
      fullName = 'Usuário Sem Nome';
    }

    // 4. Se for Professor (ou domínios @sj.pro.br)
    if (detectedType === 'professor' || email.endsWith('@sj.pro.br')) {
      // Checa se já existe na tabela 'professores'
      const { data: existingProf, error: checkError } = await supabase
        .from('professores')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        logger.error('Erro ao verificar existência do professor no inventário:', checkError);
        return;
      }

      if (!existingProf) {
        // Tenta usar a RPC 'create_teacher' se disponível, senão insere diretamente
        const { error: rpcError } = await supabase.rpc('create_teacher', {
          p_nome_completo: fullName,
          p_email: email,
          p_materia: null
        });

        if (rpcError) {
          logger.warn('RPC create_teacher falhou, tentando insert direto em professores:', rpcError);
          const { error: insertError } = await supabase
            .from('professores')
            .insert({
              nome_completo: fullName,
              email: email
            });

          if (insertError && insertError.code !== '23505') { // Ignora se duplicado
            logger.error('Erro ao inserir professor automaticamente no inventário:', insertError);
            return;
          }
        }
        logger.info(`Professor ${fullName} (${email}) sincronizado automaticamente com o inventário.`);
      }
    } 
    // 5. Se for Funcionário (ou domínios @colegiosaojudas.com.br)
    else if (detectedType === 'funcionario' || email.endsWith('@colegiosaojudas.com.br')) {
      const { data: existingStaff, error: checkError } = await supabase
        .from('funcionarios')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        logger.error('Erro ao verificar existência do funcionário no inventário:', checkError);
        return;
      }

      if (!existingStaff) {
        const { error: rpcError } = await supabase.rpc('create_staff', {
          p_nome_completo: fullName,
          p_email: email
        });

        if (rpcError) {
          logger.warn('RPC create_staff falhou, tentando insert direto em funcionarios:', rpcError);
          const { error: insertError } = await supabase
            .from('funcionarios')
            .insert({
              nome_completo: fullName,
              email: email
            });

          if (insertError && insertError.code !== '23505') {
            logger.error('Erro ao inserir funcionário automaticamente no inventário:', insertError);
            return;
          }
        }
        logger.info(`Funcionário ${fullName} (${email}) sincronizado automaticamente com o inventário.`);
      }
    }
  } catch (error) {
    logger.error('Erro ao executar sincronização de inventário:', error);
  }
}
