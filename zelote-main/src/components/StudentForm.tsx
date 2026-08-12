import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card'; // Removido CardHeader, CardTitle
import { toast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard
import logger from '@/utils/logger';
import { validateEmail } from '@/utils/emailValidation';
import { cn } from '@/lib/utils';
import { Loader2, Users } from 'lucide-react';

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

  const handleEmailValidation = (email: string) => {
    if (!email) {
      setEmailError('');
      return true;
    }

    const result = validateEmail(email, 'aluno');
    setEmailError(result.valid ? '' : result.message || '');
    return result.valid;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({
      ...prev,
      email
    }));
    handleEmailValidation(email);
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
    if (!handleEmailValidation(formData.email)) {
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
      logger.error('Erro ao cadastrar aluno', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema.",
        variant: "destructive"
      });
    }
  };

  const isFormValid = formData.nomeCompleto.trim() && formData.ra.trim() && formData.email.trim() && formData.turma.trim() && !emailError;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h4 className="font-black uppercase text-sm flex items-center gap-2 border-b-2 border-black dark:border-white pb-2 mb-6">
          <span className="bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 text-xs font-mono">01</span>
          Dados Pessoais
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="nomeCompleto" className="text-xs font-bold dark:text-white">Nome Completo *</Label>
            <Input
              id="nomeCompleto"
              value={formData.nomeCompleto}
              onChange={handleInputChange('nomeCompleto')}
              placeholder="DIGITE O NOME COMPLETO"
              required
              className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 placeholder:normal-case font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ra" className="text-xs font-bold uppercase dark:text-white">RA (Registro do Aluno) *</Label>
            <Input
              id="ra"
              value={formData.ra}
              onChange={handleInputChange('ra')}
              placeholder="DIGITE O RA"
              required
              className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold dark:text-white">E-mail Institucional *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleEmailChange}
              placeholder="aluno@sj.g12.br"
              required
              className={cn(
                "h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 placeholder:normal-case font-bold",
                emailError ? "border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-900/20" : ""
              )}
            />
            {emailError && <p className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-1 bg-red-50 p-1 border border-red-200 w-fit">{emailError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="turma" className="text-xs font-bold uppercase dark:text-white">Turma *</Label>
            <Input
              id="turma"
              value={formData.turma}
              onChange={handleInputChange('turma')}
              placeholder="DIGITE A TURMA (EX: 3A)"
              required
              className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case font-bold"
            />
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
                <Users className="h-4 w-4" /> Cadastrar Aluno
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}