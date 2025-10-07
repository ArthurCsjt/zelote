// supabase/functions/invite-user/index.ts

import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Cabeçalhos de permissão (CORS) que serão adicionados em todas as respostas
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Em produção, mude '*' para o domínio do seu site (ex: 'https://zelote.app')
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // O navegador sempre envia uma requisição 'OPTIONS' primeiro (preflight)
  // para verificar as permissões. Devemos responder a ela com 'ok'.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cria um cliente Admin do Supabase para ter superpoderes
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Pega o email e a role enviados pelo frontend
    const { email, role } = await req.json()

    // LÓGICA DE SEGURANÇA: Verifica se quem está chamando a função é um admin
    // Pega o token do usuário que fez a chamada
    const userToken = req.headers.get('Authorization')!.replace('Bearer ', '')
    // Cria um cliente com as permissões desse usuário
    const supabaseUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${userToken}` } }
    });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    // Verifica a 'role' do usuário no banco de dados
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || profile?.role !== 'admin') {
      throw new Error("Acesso negado: Apenas administradores podem convidar usuários.");
    }
    // FIM DA LÓGICA DE SEGURANÇA

    // Se a segurança passou, envia o convite usando o cliente Admin
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role: role }, // Adiciona a 'role' nos metadados do usuário
    });

    if (inviteError) throw inviteError;

    // Retorna uma resposta de sucesso, incluindo os cabeçalhos CORS
    return new Response(JSON.stringify(inviteData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // Se qualquer passo acima der erro, retorna uma mensagem de erro, também com os cabeçalhos CORS
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})