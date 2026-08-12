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
    
    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Acesso negado: Apenas administradores podem convidar usuários." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403, // Forbidden
      });
    }
    
    // 2. Validação do Payload
    const { email, role } = await req.json();
    if (!email || !role || !['admin', 'user'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Payload inválido: email e role são obrigatórios e válidos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // 3. Convidar o novo usuário
    const { data: inviteRes, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    
    if (inviteErr || !inviteRes?.user) {
      // Se o erro for 'User already exists', tratamos como sucesso para o upsert do perfil
      if (inviteErr?.message.includes('User already exists')) {
        // Tenta buscar o usuário existente para obter o ID
        const { data: existingUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
        if (fetchError || !existingUser?.user) {
             throw new Error(`Falha ao convidar ou encontrar usuário existente: ${inviteErr?.message || 'Erro desconhecido'}`);
        }
        inviteRes.user = existingUser.user;
        console.log(`Usuário ${email} já existe. Prosseguindo com atualização de perfil.`);
      } else {
        throw new Error(`Falha ao convidar o usuário: ${inviteErr?.message || 'Erro desconhecido'}`);
      }
    }

    // 4. Cria/atualiza o perfil do NOVO usuário com a role correta
    const { error: upsertErr } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: inviteRes.user.id, email, role }, { onConflict: 'id' });

    if (upsertErr) throw new Error(`Falha ao atualizar perfil: ${upsertErr.message}`);
    
    // 5. Retorna sucesso
    return new Response(JSON.stringify({ ok: true, userId: inviteRes.user.id }), {
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