import React, { useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card'; // Removido CardHeader, CardTitle
import { toast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard
import type { TeacherData } from '@/types/database'; // Importando o tipo atualizado

interface TeacherFormData extends TeacherData {
  // Herda nomeCompleto, email e materia
}

export function TeacherRegistration() {
  const [formData, setFormData] = useState<TeacherFormData>({
    nome_completo: '',
    email: '',
    materia: '' // Inicializando o novo campo
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

    // Validações: Adicionando .trim() para garantir que não são apenas espaços
    if (!formData.nome_completo.trim() || !formData.email.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome e E-mail são obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    if (!validateEmail(formData.email)) {
      return;
    }
    try {
      const teacherData: TeacherData = {
        nome_completo: formData.nome_completo.trim(), // Trim antes de enviar
        email: formData.email.trim(), // Trim antes de enviar
        materia: formData.materia?.trim() || null // Incluindo a matéria
      };
      const result = await createTeacher(teacherData);
      if (result) {
        toast({
          title: "Sucesso!",
          description: "Professor cadastrado com sucesso."
        });

        // Reset form
        setFormData({
          nome_completo: '',
          email: '',
          materia: ''
        });
      } else {
        // O erro já é tratado no useDatabase, mas garantimos que o fluxo pare aqui se falhar
        // O erro 400 Bad Request provavelmente está sendo capturado aqui se a validação de domínio falhar no backend
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

  // A variável isFormValid já garante que o botão esteja desabilitado se os campos estiverem vazios
  const isFormValid = formData.nome_completo.trim() && formData.email.trim() && !emailError;

  return (
    <GlassCard className="border-purple-200/50 shadow-lg">
      {/* CardHeader removido */}
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nomeCompleto">Nome Completo *</Label>
              <Input 
                id="nomeCompleto" 
                value={formData.nome_completo} 
                onChange={handleInputChange('nome_completo')} 
                placeholder="Digite o nome completo" 
                required 
                className="dark:bg-input dark:border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email} 
                onChange={handleEmailChange} 
                placeholder="professor@sj.pro.br" 
                required 
                className={emailError ? 'border-destructive dark:bg-input dark:border-destructive' : 'dark:bg-input dark:border-border'} 
              />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>
            
            {/* NOVO CAMPO: Matéria */}
            <div className="space-y-2">
              <Label htmlFor="materia">Matéria (Opcional)</Label>
              <Input 
                id="materia" 
                value={formData.materia} 
                onChange={handleInputChange('materia')} 
                placeholder="Ex: Matemática, História, Inglês" 
                className="dark:bg-input dark:border-border"
              />
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
    </GlassCard>
  );
}