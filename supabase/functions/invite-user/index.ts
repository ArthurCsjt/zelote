import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { email, role } = await req.json();
    console.log('Convite solicitado para:', email, 'com role:', role);
    
    if (!email || !role || !['admin','user'].includes(role)) {
      console.error('Payload inválido:', { email, role });
      return new Response(JSON.stringify({ error: 'Payload inválido' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error('Variáveis de ambiente não configuradas');
      return new Response(JSON.stringify({ error: 'Configuração do servidor incompleta' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Enviando convite para:', email);
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);
    
    if (inviteError) {
      console.error('Erro ao enviar convite:', inviteError);
      throw inviteError;
    }

    if (!inviteData?.user) {
      console.error('Usuário não foi criado');
      throw new Error('Falha ao criar usuário');
    }

    const userId = inviteData.user.id;
    console.log('Usuário criado com ID:', userId);

    console.log('Criando perfil para o usuário...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ 
        id: userId, 
        email: email,
        role: role 
      });

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      throw profileError;
    }

    console.log('Convite enviado com sucesso!');
    return new Response(JSON.stringify({ success: true, userId }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (e) {
    console.error('Erro no edge function:', e);
    return new Response(JSON.stringify({ 
      error: e?.message || 'Erro desconhecido',
      details: e?.toString()
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
