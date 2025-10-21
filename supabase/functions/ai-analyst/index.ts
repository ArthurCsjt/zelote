// v2 - Forçando re-deploy após atualização de secret
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to fetch all relevant data from the database
async function fetchDatabaseContext(supabaseAdmin: any) {
  // Fetch active loans (simplified context)
  const { data: activeLoans } = await supabaseAdmin.from('loans').select('id, chromebook_id, student_name, user_type, loan_date').is('return_date', null).limit(100);
  
  // Fetch chromebook status summary
  const { data: chromebooks } = await supabaseAdmin.from('chromebooks').select('status, model, chromebook_id').limit(1000);

  // Fetch recent returns
  const { data: recentReturns } = await supabaseAdmin.from('returns').select('return_date, loan_id').order('return_date', { ascending: false }).limit(50);

  return { activeLoans, chromebooks, recentReturns };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { userQuestion } = body;

    if (!userQuestion) {
      return new Response(
        JSON.stringify({ error: 'Pergunta do usuário é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      // Retorna um erro 500 claro se a chave estiver faltando
      return new Response(
        JSON.stringify({ error: 'Chave da API do Gemini (GEMINI_API_KEY) não configurada no Supabase Secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use the Service Role Key to fetch data securely
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch relevant data context
    const context = await fetchDatabaseContext(supabaseAdmin);

    const databaseContext = `
    Você é um assistente especializado em análise de dados de empréstimos de Chromebooks. 
    
    Aqui estão os dados atuais do sistema (em formato JSON):
    
    --- INÍCIO DO CONTEXTO DE DADOS ---
    
    Empréstimos Ativos (loans): ${JSON.stringify(context.activeLoans)}
    
    Status dos Chromebooks (chromebooks): ${JSON.stringify(context.chromebooks)}
    
    Devoluções Recentes (returns): ${JSON.stringify(context.recentReturns)}
    
    --- FIM DO CONTEXTO DE DADOS ---
    
    Analise os dados fornecidos acima para responder à pergunta do usuário.
    
    PERGUNTA DO USUÁRIO: ${userQuestion}
    
    Forneça uma resposta clara, objetiva e formatada EXCLUSIVAMENTE em Markdown.
    `;

    // Chamar a API do Gemini
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: databaseContext
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Erro da API do Gemini:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao comunicar com a API do Gemini', details: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Nenhuma resposta gerada.';

    return new Response(
      JSON.stringify({ 
        response: generatedText,
        userQuestion 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});