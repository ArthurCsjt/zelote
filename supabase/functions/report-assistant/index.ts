import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Obter a chave da API do Gemini
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Chave da API do Gemini não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar o contexto do banco de dados para o Gemini
    const databaseSchema = `
    Você é um especialista em SQL para PostgreSQL. Use as seguintes tabelas para gerar consultas:

    TABELA: chromebooks
    Colunas:
    - id (uuid, chave primária)
    - chromebook_id (text, identificador único do chromebook)
    - model (text, modelo do chromebook)
    - serial_number (text, opcional)
    - patrimony_number (text, opcional)
    - status (enum: 'disponivel', 'emprestado', 'manutencao', 'fixo', 'fora_uso')
    - condition (text, opcional)
    - location (text, opcional)
    - created_at (timestamp)
    - updated_at (timestamp)
    - is_deprovisioned (boolean, se o equipamento foi desprovisionado)

    TABELA: loans (empréstimos)
    Colunas:
    - id (uuid, chave primária)
    - chromebook_id (uuid, referencia chromebooks.id)
    - student_name (text, nome do estudante)
    - student_ra (text, RA do estudante, opcional)
    - student_email (text, email do estudante)
    - purpose (text, finalidade do empréstimo)
    - user_type (enum: 'aluno', 'professor', 'funcionario')
    - loan_type (enum: 'individual', 'lote')
    - loan_date (timestamp, data do empréstimo)
    - expected_return_date (timestamp, opcional)
    - created_at (timestamp)
    - updated_at (timestamp)

    TABELA: returns (devoluções)
    Colunas:
    - id (uuid, chave primária)
    - loan_id (uuid, referencia loans.id)
    - returned_by_name (text, nome de quem devolveu)
    - returned_by_ra (text, RA de quem devolveu, opcional)
    - returned_by_email (text, email de quem devolveu)
    - returned_by_type (enum: 'aluno', 'professor', 'funcionario')
    - return_date (timestamp, data da devolução)
    - notes (text, observações, opcional)
    - created_at (timestamp)

    Para identificar empréstimos ativos (não devolvidos), use:
    SELECT * FROM loans l WHERE NOT EXISTS (SELECT 1 FROM returns r WHERE r.loan_id = l.id)

    Para empréstimos devolvidos, faça JOIN entre loans e returns:
    SELECT * FROM loans l JOIN returns r ON l.id = r.loan_id

    PERGUNTA DO USUÁRIO: ${userQuestion}

    Retorne APENAS o código SQL da consulta, sem explicações, comentários ou formatação adicional. A consulta deve começar com SELECT.
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
            text: databaseSchema
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1000,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Erro da API do Gemini:', errorText);
      // Retorna 502 Bad Gateway para indicar falha na comunicação com o serviço externo
      return new Response(
        JSON.stringify({ error: 'Erro ao comunicar com a API do Gemini', details: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const generatedSQL = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!generatedSQL) {
      // Se a IA não retornar SQL, pode ser um erro 500
      return new Response(
        JSON.stringify({ error: 'Não foi possível gerar uma consulta SQL. Tente reformular a pergunta.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('SQL gerado pelo Gemini:', generatedSQL);

    // Validação de segurança básica
    const cleanSQL = generatedSQL.replace(/```sql|```/g, '').trim();
    if (!cleanSQL.toLowerCase().startsWith('select')) {
      return new Response(
        JSON.stringify({ error: 'Apenas consultas SELECT são permitidas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase para executar a consulta
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Usamos o Service Role Key para garantir que a função RPC 'execute_sql' possa ser chamada
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Executar a consulta usando a função RPC
    const { data, error } = await supabase.rpc('execute_sql', { query: cleanSQL });

    if (error) {
      console.error('Erro ao executar SQL:', error);
      // Retorna 500 Internal Server Error se a execução do SQL falhar
      // Incluímos a mensagem de erro do banco de dados para melhor diagnóstico no frontend
      return new Response(
        JSON.stringify({ error: 'Erro ao executar a consulta no banco de dados', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        query: cleanSQL,
        data: data || [],
        userQuestion 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    // Retorna 500 para erros internos não capturados
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});