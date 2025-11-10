import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, Loader2, Send } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';

interface TestEmailSenderProps {
  toEmail: string;
}

export const TestEmailSender: React.FC<TestEmailSenderProps> = ({ toEmail }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendTestEmail = async () => {
    setIsLoading(true);
    
    const testPayload = {
      toEmail: toEmail,
      professorName: "Arthur Alencar (Teste)",
      subject: "Aula de Informática - 3º Ano A",
      date: "25/12/2024",
      time: "10h00",
      quantity: 15,
    };

    try {
      // Chamada direta à Edge Function
      const { data, error } = await supabase.functions.invoke('send-reservation-email', {
        body: testPayload,
        headers: {
          // Passa o token do usuário logado para a Edge Function
          'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
        }
      });

      if (error) throw error;

      toast({
        title: "E-mail de Teste Enviado!",
        description: `Verifique a caixa de entrada de ${toEmail}. Resend ID: ${data.resendId}`,
        variant: "success",
      });

    } catch (e: any) {
      console.error("Erro ao enviar e-mail de teste:", e);
      toast({
        title: "Falha no Envio de Teste",
        description: e.message || "Verifique a chave RESEND_API_KEY e o log da Edge Function.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard className="border-info/50 bg-info-bg/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-info-foreground">
          <Mail className="h-5 w-5 text-info" />
          Teste de Envio de E-mail (Resend)
        </CardTitle>
        <CardDescription className="text-info-foreground">
          Dispare um e-mail de confirmação de agendamento para verificar a integração com o Resend.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          O e-mail será enviado para: <span className="font-semibold text-foreground">{toEmail}</span>
        </p>
        <Button 
          onClick={handleSendTestEmail}
          disabled={isLoading}
          className="w-full bg-info hover:bg-info-foreground/90 text-info-foreground"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando Teste...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar E-mail de Teste
            </>
          )}
        </Button>
      </CardContent>
    </GlassCard>
  );
};