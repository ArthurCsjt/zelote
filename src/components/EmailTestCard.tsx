import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, Loader2, Send, AlertCircle } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Input } from './ui/input';
import { Label } from './ui/label';

export const EmailTestCard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const isValidEmail = (input: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (newEmail && !isValidEmail(newEmail)) {
      setEmailError('Formato de e-mail inválido.');
    } else {
      setEmailError(null);
    }
  };

  const handleSendTestEmail = async () => {
    if (!isValidEmail(email)) {
      setEmailError('Por favor, insira um e-mail válido.');
      return;
    }
    
    setIsLoading(true);
    
    const testPayload = {
      toEmail: email,
      professorName: "Arthur Alencar (Teste)",
      subject: "Aula de Informática - 3º Ano A",
      date: "25/12/2024",
      time: "10h00",
      quantity: 15,
    };

    try {
      const { data, error } = await supabase.functions.invoke('send-reservation-email', {
        body: testPayload,
        headers: {
          'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
        }
      });

      if (error) throw error;

      toast({
        title: "E-mail de Teste Enviado!",
        description: `Verifique a caixa de entrada de ${email}. Resend ID: ${data.resendId}`,
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

  const isButtonDisabled = isLoading || !isValidEmail(email);

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
        <div className="space-y-2">
            <Label htmlFor="test-email" className="text-sm font-medium text-foreground">
                E-mail de Destino
            </Label>
            <Input 
                id="test-email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="exemplo@dominio.com"
                className={emailError ? 'border-destructive' : ''}
            />
            {emailError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {emailError}
                </p>
            )}
        </div>
        <Button 
          onClick={handleSendTestEmail}
          disabled={isButtonDisabled}
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