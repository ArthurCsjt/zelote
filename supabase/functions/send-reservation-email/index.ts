import { serve } from "https://deno.land/std@0.223.0/http/server.ts";

// Cabeçalhos de permissão (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para gerar o corpo HTML do e-mail
function generateEmailHtml({ professorName, subject, date, time, quantity }: any) {
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
                    <span class="label">Assunto/Turma:</span> ${subject}
                </div>
            </div>

            <p>Por favor, retire os equipamentos no horário agendado. Em caso de dúvidas, entre em contato com a administração.</p>
            <p>Atenciosamente,<br>Equipe Zelote</p>
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
    const { toEmail, professorName, subject, date, time, quantity } = await req.json();

    if (!toEmail || !professorName || !subject || !date || !time || !quantity) {
      return new Response(JSON.stringify({ error: 'Dados de reserva incompletos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // Renderiza o HTML
    const htmlContent = generateEmailHtml({ professorName, subject, date, time, quantity });

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
        subject: `Confirmação de Agendamento - ${subject}`,
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