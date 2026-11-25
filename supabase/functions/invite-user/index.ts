// @ts-nocheck
// Supabase Edge Function: invite-user (VERSÃO FINAL, SEGURA E COM CORS)

import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"; // Versão atualizada

// Cabeçalhos de permissão (CORS) que serão adicionados em todas as respostas
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Em produção, mude '*' para o domínio do seu site
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Responde à requisição de verificação (preflight) do navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Cria o cliente ADMIN fora do bloco try/catch para uso imediato
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // 1. Validação de Autenticação e Autorização (Admin Check)
    const userToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!userToken) {
        return new Response(JSON.stringify({ error: 'Token de autenticação não encontrado.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        });
    }

    // Cria um cliente com as permissões do usuário que fez a chamada
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${userToken}` } } }
    );
    
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Usuário não autenticado ou token inválido.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        });
    }

    // Verifica a 'role' do usuário no banco (usando o cliente ADMIN)
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    
    if (profileError || !['admin', 'super_admin'].includes(profile?.role)) {
      return new Response(JSON.stringify({ error: "Acesso negado: Apenas administradores podem convidar usuários." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403, // Forbidden
      });
    }
    
    // 2. Validação do Payload
    const { email, role } = await req.json();
    if (!email || !role || !['admin', 'user', 'professor', 'manutencao'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Payload inválido: email e role são obrigatórios e válidos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // 3. Convidar o novo usuário
    const { data: inviteRes, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    let targetUserId = inviteRes?.user?.id;
    
    if (inviteErr || !targetUserId) {
      // Se o usuário já existe no Auth, busca o ID via profiles ou listUsers (getUserByEmail foi removido no v2)
      if (inviteErr?.message?.toLowerCase().includes('already')) {
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .ilike('email', email)
          .maybeSingle();

        if (existingProfile?.id) {
          targetUserId = existingProfile.id;
        } else {
          const { data: usersPage, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          if (listErr) throw new Error(`Falha ao buscar usuário existente: ${listErr.message}`);
          const found = usersPage?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
          if (!found) {
            throw new Error(`Falha ao convidar ou encontrar usuário existente: ${inviteErr?.message || 'Erro desconhecido'}`);
          }
          targetUserId = found.id;
        }
        console.log(`Usuário ${email} já existe. Prosseguindo com atualização de perfil.`);
      } else {
        throw new Error(`Falha ao convidar o usuário: ${inviteErr?.message || 'Erro desconhecido'}`);
      }
    }

    // 4. Cria/atualiza o perfil do usuário com a role correta
    const { error: upsertErr } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: targetUserId, email, role }, { onConflict: 'id' });

    if (upsertErr) throw new Error(`Falha ao atualizar perfil: ${upsertErr.message}`);
    
    // 5. Retorna sucesso
    return new Response(JSON.stringify({ ok: true, userId: targetUserId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    // Retorna erro
    return new Response(JSON.stringify({ error: e?.message || 'Erro desconhecido' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Usar 400 para erros de cliente/lógica, 500 para erros de servidor
    });
  }
});