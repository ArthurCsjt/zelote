import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Cabeçalhos de permissão (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para gerar o corpo HTML do e-mail
function generateEmailHtml({
  professorName,
  professorEmail,
  justification,
  date,
  time,
  quantity,
  needs_tv,
  needs_sound,
  needs_mic,
  mic_quantity,
  is_minecraft,
  classroom
}: any) {
  // Gerar lista de equipamentos auxiliares
  const equipmentList = [];
  if (needs_tv) equipmentList.push('📺 TV');
  if (needs_sound) equipmentList.push('🔊 Som');
  if (needs_mic) equipmentList.push(`🎤 Microfone (${mic_quantity || 1})`);

  const equipmentHtml = equipmentList.length > 0
    ? `
      <div class="detail-item">
        <span class="label">Equipamentos Auxiliares:</span> ${equipmentList.join(', ')}
      </div>
    `
    : '';

  const minecraftHtml = is_minecraft
    ? `
      <div class="detail-item" style="background-color: #3c8527; color: white; padding: 10px; margin: 10px 0; border-radius: 4px; font-weight: bold; text-align: center;">
        🎮 AULA DE MINECRAFT - REQUER PREPARAÇÃO ESPECIAL
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
            .container { background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
            h2 { color: #4f46e5; }
            .details { margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px; }
            .detail-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #333; }
            .justification { background-color: #f9fafb; padding: 10px; border-left: 3px solid #4f46e5; margin: 10px 0; }
            .temp-alert { background-color: #eff6ff; border: 2px solid #3b82f6; padding: 15px; margin-bottom: 20px; border-radius: 4px; color: #1e40af; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="temp-alert">
                <strong>📢 NOTIFICAÇÃO DE RESERVA</strong><br>
                Solicitada por: <strong>${professorName}</strong> (${professorEmail})
            </div>

            <h2>✅ Confirmação de Agendamento - Zelote</h2>
            <p>Olá, o agendamento de Chromebooks foi realizado no sistema!</p>

            ${minecraftHtml}

            <div class="details">
                <div class="detail-item">
                    <span class="label">Data:</span> ${date}
                </div>
                <div class="detail-item">
                    <span class="label">Horário:</span> ${time}
                </div>
                <div class="detail-item">
                    <span class="label">Quantidade:</span> ${quantity} Chromebook(s)
                </div>
                <div class="detail-item">
                    <span class="label">Justificativa:</span>
                    <div class="justification">${justification}</div>
                </div>
                <div class="detail-item">
                    <span class="label">Sala / Turma:</span> ${classroom || 'Não informada'}
                </div>
                ${equipmentHtml}
            </div>

            <p>Atenciosamente,<br>Zelote System</p>
        </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  // Responde a requisições OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY não configurada.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Faltando header de autorização' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado: Token inválido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const payload = await req.json();
    const {
      toEmail,
      professorName,
      justification,
      date,
      time,
      quantity,
      needs_tv,
      needs_sound,
      needs_mic,
      mic_quantity,
      is_minecraft,
      classroom
    } = payload;

    if (!toEmail || !professorName || !justification || !date || !time || !quantity) {
      return new Response(JSON.stringify({ error: 'Dados de reserva incompletos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Renderiza o HTML
    const htmlContent = generateEmailHtml({
      professorName,
      professorEmail: toEmail,
      justification,
      date,
      time,
      quantity,
      needs_tv,
      needs_sound,
      needs_mic,
      mic_quantity,
      is_minecraft,
      classroom
    });

    // Chamada à API do Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Zelote <onboarding@resend.dev>', // Usando onboarding para passar pela trava de sandbox
        to: ['arthur.alencar@colegiosaojudas.com.br'], // Enviando apenas para o dono da conta (Arthur)
        subject: `${is_minecraft ? '🎮 MINECRAFT - ' : ''}Reserva: ${professorName} - ${date} - ${time}`,
        html: htmlContent,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Erro do Resend:', resendData);
      return new Response(JSON.stringify({ error: 'Falha ao enviar e-mail via Resend', details: resendData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'E-mail enviado com sucesso', resendId: resendData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Erro geral na Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno do servidor' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});