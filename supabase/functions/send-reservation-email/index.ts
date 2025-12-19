import { serve } from "https://deno.land/std@0.223.0/http/server.ts";

// Cabeçalhos de permissão (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para gerar o corpo HTML do e-mail
function generateEmailHtml({
  professorName,
  justification,
  date,
  time,
  quantity,
  needs_tv,
  needs_sound,
  needs_mic,
  mic_quantity
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
        </style>
    </head>
    <body>
        <div class="container">
            <h2>✅ Confirmação de Agendamento - Zelote</h2>
            <p>Olá, Professor(a) ${professorName},</p>
            <p>Seu agendamento de Chromebooks foi confirmado com sucesso!</p>

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
                ${equipmentHtml}
            </div>

            <p>Por favor, retire os equipamentos no horário agendado. Em caso de dúvidas, entre em contato com a administração.</p>
            <p>Atenciosamente,<br>Equipe de TI</p>
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
      mic_quantity
    } = await req.json();

    if (!toEmail || !professorName || !justification || !date || !time || !quantity) {
      return new Response(JSON.stringify({ error: 'Dados de reserva incompletos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Renderiza o HTML
    const htmlContent = generateEmailHtml({
      professorName,
      justification,
      date,
      time,
      quantity,
      needs_tv,
      needs_sound,
      needs_mic,
      mic_quantity
    });

    // Chamada à API do Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Zelote <onboarding@resend.dev>', // Use um domínio verificado ou o domínio de teste do Resend
        to: [toEmail],
        subject: `Confirmação de Agendamento - ${justification.substring(0, 50)}${justification.length > 50 ? '...' : ''}`,
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

  } catch (error) {
    console.error('Erro geral na Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno do servidor' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});