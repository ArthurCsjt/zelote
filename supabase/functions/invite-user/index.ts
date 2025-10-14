// @ts-nocheck
// Supabase Edge Function: invite-user (VERSÃO FINAL, SEGURA E COM CORS)

import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  try {
    // Validação básica do payload
    const { email, role } = await req.json();
    if (!email || !role || !['admin', 'user'].includes(role)) {
      throw new Error('Payload inválido: email e role são obrigatórios.');
    }
    
    // === INÍCIO DA CAMADA DE SEGURANÇA ===
    // Pega o token do usuário que está TENTANDO convidar alguém
    const userToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!userToken) {
        throw new Error('Token de autenticação não encontrado.');
    }

    // Cria um cliente com as permissões do usuário que fez a chamada
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${userToken}` } } }
    );
    const { data: { user } } = await supabaseUserClient.auth.getUser();
    if (!user) {
        throw new Error('Usuário não autenticado ou token inválido.');
    }

    // Usando o cliente ADMIN para verificar a 'role' do usuário no banco
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || profile?.role !== 'admin') {
      throw new Error("Acesso negado: Apenas administradores podem convidar usuários.");
    }
    // === FIM DA CAMADA DE SEGURANÇA ===


    // Se a segurança passou, o ADMIN pode convidar o novo usuário
    const { data: inviteRes, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (inviteErr || !inviteRes?.user) {
      throw inviteErr || new Error('Falha ao convidar o usuário.');
    }

    // Cria/atualiza o perfil do NOVO usuário com a role correta
    const { error: upsertErr } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: inviteRes.user.id, email, role }, { onConflict: 'id' });

    if (upsertErr) throw upsertErr;
    
    // Retorna sucesso
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