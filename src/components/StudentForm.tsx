import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card'; // Removido CardHeader, CardTitle
import { toast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard

interface StudentFormData {
  nomeCompleto: string;
  ra: string;
  email: string;
  turma: string;
}
export function StudentForm() {
  const [formData, setFormData] = useState<StudentFormData>({
    nomeCompleto: '',
    ra: '',
    email: '',
    turma: ''
  });
  const [emailError, setEmailError] = useState<string>('');
  const {
    createStudent,
    loading
  } = useDatabase();
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('');
      return true;
    }
    if (!email.endsWith('@sj.g12.br')) {
      setEmailError('E-mail deve terminar com @sj.g12.br');
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
  const handleInputChange = (field: keyof StudentFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Garante que o evento padrão seja prevenido imediatamente

    // Validações
    if (!formData.nomeCompleto.trim() || !formData.ra.trim() || !formData.email.trim() || !formData.turma.trim()) {
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
    
    // Se já estiver carregando, ignora o clique (proteção extra contra cliques rápidos)
    if (loading) return; 

    try {
      const studentData = {
        nome_completo: formData.nomeCompleto.trim(),
        ra: formData.ra.trim(),
        email: formData.email.trim(),
        turma: formData.turma.trim()
      };
      
      const result = await createStudent(studentData);
      
      if (result) {
        toast({
          title: "Sucesso!",
          description: "Aluno cadastrado com sucesso."
        });

        // Reset form
        setFormData({
          nomeCompleto: '',
          ra: '',
          email: '',
          turma: ''
        });
      } else {
        // O erro já é tratado no useDatabase, mas garantimos que o fluxo pare aqui se falhar
      }
    } catch (error) {
      console.error('Erro ao cadastrar aluno:', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema.",
        variant: "destructive"
      });
    }
  };
  
  const isFormValid = formData.nomeCompleto.trim() && formData.ra.trim() && formData.email.trim() && formData.turma.trim() && !emailError;
  
  return <GlassCard>
      {/* CardHeader removido */}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nomeCompleto">Nome Completo *</Label>
              <Input 
                id="nomeCompleto" 
                value={formData.nomeCompleto} 
                onChange={handleInputChange('nomeCompleto')} 
                placeholder="Digite o nome completo" 
                required 
                className="dark:bg-input dark:border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ra">RA (Registro do Aluno) *</Label>
              <Input 
                id="ra" 
                value={formData.ra} 
                onChange={handleInputChange('ra')} 
                placeholder="Digite o RA" 
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
                placeholder="aluno@sj.g12.br" 
                required 
                className={emailError ? 'border-destructive dark:bg-input dark:border-destructive' : 'dark:bg-input dark:border-border'} 
              />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="turma">Turma *</Label>
              <Input 
                id="turma" 
                value={formData.turma} 
                onChange={handleInputChange('turma')} 
                placeholder="Digite a turma" 
                required 
                className="dark:bg-input dark:border-border"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading || !isFormValid} className="min-w-32">
              {loading ? 'Cadastrando...' : 'Cadastrar Aluno'}
            </Button>
          </div>
        </form>
      </CardContent>
    </GlassCard>;
}