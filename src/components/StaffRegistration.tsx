import React, { useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card'; // Removido CardHeader, CardTitle, CardDescription
import { toast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard

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

  const DOMAIN_SUFFIX = '@colegiosaojudas.com.br';

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('');
      return true;
    }
    if (!email.endsWith(DOMAIN_SUFFIX)) {
      setEmailError(`E-mail deve terminar com ${DOMAIN_SUFFIX}`);
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    validateEmail(email);
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
    if (!validateEmail(formData.email)) {
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
      console.error('Erro ao cadastrar funcionário:', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema.",
        variant: "destructive"
      });
    }
  };

  const isFormValid = formData.nomeCompleto && formData.email && !emailError;

  return (
    <GlassCard className="border-blue-200/50 shadow-lg">
      {/* CardHeader removido */}
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome Completo */}
            <div className="space-y-2">
              <Label htmlFor="nomeCompleto">Nome Completo *</Label>
              <Input 
                id="nomeCompleto" 
                value={formData.nomeCompleto} 
                onChange={handleInputChange('nomeCompleto')} 
                placeholder="Digite o nome completo" 
                required 
              />
            </div>

            {/* E-mail */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={handleEmailChange} 
                  placeholder={`exemplo${DOMAIN_SUFFIX}`} 
                  required 
                  className={emailError ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {/* Exibe o sufixo do domínio como um helper visual */}
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground pointer-events-none hidden sm:block">
                  {DOMAIN_SUFFIX}
                </span>
              </div>
              {emailError && <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                {emailError}
              </p>}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={loading || !isFormValid} 
              className="min-w-32 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : 'Cadastrar Funcionário'}
            </Button>
          </div>
        </form>
      </CardContent>
    </GlassCard>
  );
}