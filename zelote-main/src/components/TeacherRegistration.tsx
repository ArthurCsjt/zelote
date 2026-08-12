import React, { useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card'; // Removido CardHeader, CardTitle
import { toast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard
import type { TeacherData } from '@/types/database'; // Importando o tipo atualizado
import logger from '@/utils/logger';
import { validateEmail } from '@/utils/emailValidation';

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

  const handleEmailValidation = (email: string) => {
    if (!email) {
      setEmailError('');
      return true;
    }

    const result = validateEmail(email, 'professor');
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
    if (!handleEmailValidation(formData.email)) {
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
      logger.error('Erro ao cadastrar professor', error);
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
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-950 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h4 className="font-black uppercase text-sm flex items-center gap-2 border-b-2 border-black dark:border-white pb-2 mb-6">
            <span className="bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 text-xs font-mono">01</span>
            Dados do Professor
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="nomeCompleto" className="text-xs font-bold dark:text-white">Nome Completo *</Label>
              <Input
                id="nomeCompleto"
                value={formData.nome_completo}
                onChange={handleInputChange('nome_completo')}
                placeholder="DIGITE O NOME COMPLETO"
                required
                className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 placeholder:normal-case font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold dark:text-white">E-mail Institucional *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleEmailChange}
                placeholder="professor@sj.pro.br"
                required
                className={cn(
                  "h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 placeholder:normal-case font-bold",
                  emailError ? "border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-900/20" : ""
                )}
              />
              {emailError && <p className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-1 bg-red-50 p-1 border border-red-200 w-fit">{emailError}</p>}
            </div>

            {/* NOVO CAMPO: Matéria */}
            <div className="space-y-1.5">
              <Label htmlFor="materia" className="text-xs font-bold dark:text-white">Matéria (Opcional)</Label>
              <Input
                id="materia"
                value={formData.materia || ''}
                onChange={handleInputChange('materia')}
                placeholder="EX: MATEMÁTICA, HISTÓRIA"
                className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 placeholder:normal-case font-bold"
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
                  <GraduationCap className="h-4 w-4" /> Cadastrar Professor
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}