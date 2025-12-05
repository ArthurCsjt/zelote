import React, { useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card'; // Removido CardHeader, CardTitle, CardDescription
import { toast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard
import logger from '@/utils/logger';
import { validateEmail, EMAIL_DOMAINS } from '@/utils/emailValidation';

interface StaffFormData {
  nomeCompleto: string;
  email: string;
}

export function StaffRegistration() {
  const [formData, setFormData] = useState<StaffFormData>({
    nomeCompleto: '',
    email: ''
  });
  const [emailError, setEmailError] = useState<string>('');
  const { createStaff, loading } = useDatabase();

  const DOMAIN_SUFFIX = EMAIL_DOMAINS.FUNCIONARIO;

  const handleEmailValidation = (email: string) => {
    if (!email) {
      setEmailError('');
      return true;
    }

    const result = validateEmail(email, 'funcionario');
    setEmailError(result.valid ? '' : result.message || '');
    return result.valid;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    handleEmailValidation(email);
  };

  const handleInputChange = (field: keyof StaffFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nomeCompleto || !formData.email) {
      toast({
        title: "Erro de validação",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    if (!handleEmailValidation(formData.email)) {
      return;
    }

    try {
      const staffData = {
        nome_completo: formData.nomeCompleto,
        email: formData.email
      };

      const result = await createStaff(staffData);

      if (result) {
        toast({
          title: "Sucesso!",
          description: `Funcionário ${formData.nomeCompleto} cadastrado.`,
        });

        setFormData({ nomeCompleto: '', email: '' });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao cadastrar funcionário. Verifique se o e-mail não está em uso.",
          variant: "destructive"
        });
      }
    } catch (error) {
      logger.error('Erro ao cadastrar funcionário', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema.",
        variant: "destructive"
      });
    }
  };

  // A variável isFormValid já garante que o botão esteja desabilitado se os campos estiverem vazios
  const isFormValid = formData.nomeCompleto && formData.email && !emailError;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-950 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h4 className="font-black uppercase text-sm flex items-center gap-2 border-b-2 border-black dark:border-white pb-2 mb-6">
            <span className="bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 text-xs font-mono">01</span>
            Dados do Funcionário
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome Completo */}
            <div className="space-y-1.5">
              <Label htmlFor="nomeCompleto" className="text-xs font-bold uppercase dark:text-white">Nome Completo *</Label>
              <Input
                id="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={handleInputChange('nomeCompleto')}
                placeholder="DIGITE O NOME COMPLETO"
                required
                className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case font-bold"
              />
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase dark:text-white">E-mail Institucional *</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  placeholder={`EX: EXEMPLO${DOMAIN_SUFFIX}`}
                  required
                  className={cn(
                    "h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 placeholder:normal-case font-bold",
                    emailError ? "border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-900/20" : ""
                  )}
                />
                {/* Exibe o sufixo do domínio como um helper visual */}
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[10px] font-bold text-gray-400 dark:text-white/50 pointer-events-none hidden sm:block">
                  {DOMAIN_SUFFIX}
                </span>
              </div>
              {emailError && <p className="text-[10px] font-bold uppercase text-red-600 flex items-center gap-1 mt-1 bg-red-50 p-1 border border-red-200 w-fit">
                {emailError}
              </p>}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t-2 border-dashed border-black/20 dark:border-white/20">
            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full sm:w-auto h-12 border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-black hover:bg-gray-800 text-white font-black uppercase tracking-wide transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cadastrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Cadastrar Funcionário
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}