import React, { useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';

interface TeacherFormData {
  nomeCompleto: string;
  email: string;
}

export function TeacherRegistration() {
  const [formData, setFormData] = useState<TeacherFormData>({
    nomeCompleto: '',
    email: ''
  });
  const [emailError, setEmailError] = useState<string>('');
  const {
    createTeacher,
    loading
  } = useDatabase();

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('');
      return true;
    }
    if (!email.endsWith('@sj.pro.br')) {
      setEmailError('E-mail deve terminar com @sj.pro.br');
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

  const handleInputChange = (field: keyof TeacherFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const teacherData = {
        nome_completo: formData.nomeCompleto,
        email: formData.email
      };
      const result = await createTeacher(teacherData);
      if (result) {
        toast({
          title: "Sucesso!",
          description: "Professor cadastrado com sucesso."
        });

        // Reset form
        setFormData({
          nomeCompleto: '',
          email: ''
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao cadastrar professor. Verifique se o e-mail não está em uso.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao cadastrar professor:', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema.",
        variant: "destructive"
      });
    }
  };

  const isFormValid = formData.nomeCompleto && formData.email && !emailError;

  return (
    <Card className="glass-card border-purple-200/50 shadow-lg">
      <CardHeader className="bg-purple-50/50 border-b border-purple-100">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-purple-600" />
          <CardTitle className="text-xl text-purple-800">Formulário de Cadastro</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nomeCompleto">Nome Completo *</Label>
              <Input id="nomeCompleto" value={formData.nomeCompleto} onChange={handleInputChange('nomeCompleto')} placeholder="Digite o nome completo" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" type="email" value={formData.email} onChange={handleEmailChange} placeholder="professor@sj.pro.br" required className={emailError ? 'border-destructive' : ''} />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading || !isFormValid} className="min-w-32 bg-purple-600 hover:bg-purple-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : 'Cadastrar Professor'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}