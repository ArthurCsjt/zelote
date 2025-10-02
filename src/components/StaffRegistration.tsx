import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';
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
  const {
    createStaff,
    loading
  } = useDatabase();
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('');
      return true;
    }
    if (!email.endsWith('@colegiosaojudas.com.br')) {
      setEmailError('E-mail deve terminar com @colegiosaojudas.com.br');
      return false;
    }
    setEmailError('');
    return true;
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({
      ...prev,
      email
    }));
    validateEmail(email);
  };
  const handleInputChange = (field: keyof StaffFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
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
          description: "Funcionário cadastrado com sucesso."
        });

        // Reset form
        setFormData({
          nomeCompleto: '',
          email: ''
        });
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
  return <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h2 className="font-semibold text-xl text-blue-600 text-center">Cadastro de Funcionários</h2>
      </div>

      <Card>
        <CardHeader>
          
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                <Input id="nomeCompleto" value={formData.nomeCompleto} onChange={handleInputChange('nomeCompleto')} placeholder="Digite o nome completo" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleEmailChange} placeholder="funcionario@colegiosaojudas.com.br" required className={emailError ? 'border-destructive' : ''} />
                {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading || !isFormValid} className="min-w-32">
                {loading ? 'Cadastrando...' : 'Cadastrar Funcionário'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>;
}