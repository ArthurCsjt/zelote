import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Save, User, GraduationCap, Briefcase } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import { validateEmailDomain } from '@/utils/emailValidation';
import { cn } from '@/lib/utils';

// Tipos de dados de usuário (devem ser compatíveis com o UserInventory)
interface UserData {
  id: string;
  nome_completo: string;
  email: string;
  tipo: 'Aluno' | 'Professor' | 'Funcionário';
  ra?: string;
  turma?: string;
}

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  onSuccess: () => void;
}

export function UserEditDialog({ open, onOpenChange, user, onSuccess }: UserEditDialogProps) {
  const { updateStudent, updateTeacher, updateStaff, loading } = useDatabase();
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [emailError, setEmailError] = useState<string>('');

  useEffect(() => {
    if (user) {
      setFormData({
        nome_completo: user.nome_completo,
        email: user.email,
        ra: user.ra || '',
        turma: user.turma || '',
      });
      setEmailError('');
    }
  }, [user]);

  const validateEmail = (email: string, type: UserData['tipo']) => {
    const userType: any = type.toLowerCase().replace('í', 'i'); // funcionario
    const validation = validateEmailDomain(email, userType);

    if (!validation.valid) {
      setEmailError(validation.message || 'E-mail inválido');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleInputChange = (field: keyof Partial<UserData>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    if (field === 'email' && user) {
      validateEmail(e.target.value, user.tipo);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.nome_completo || !formData.email) return;

    if (!validateEmail(formData.email, user.tipo)) {
      toast({ title: "Erro de validação", description: "Corrija o formato do e-mail.", variant: "destructive" });
      return;
    }

    let success = false;
    const payload = {
      nome_completo: formData.nome_completo,
      email: formData.email,
      ...(user.tipo === 'Aluno' && { ra: formData.ra, turma: formData.turma }),
    };

    try {
      switch (user.tipo) {
        case 'Aluno':
          success = await updateStudent(user.id, payload);
          break;
        case 'Professor':
          success = await updateTeacher(user.id, payload);
          break;
        case 'Funcionário':
          success = await updateStaff(user.id, payload);
          break;
      }

      if (success) {
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao salvar alterações.", variant: "destructive" });
    }
  };

  if (!user) return null;

  const Icon = user.tipo === 'Aluno' ? GraduationCap : user.tipo === 'Professor' ? User : Briefcase;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-dialog sm:max-w-[500px]">
        <DialogHeader className="neo-dialog-header-yellow">
          <DialogTitle className="neo-dialog-title">
            <div className="p-1.5 border-2 border-black dark:border-white bg-white dark:bg-black">
              <Icon className="h-5 w-5 text-black dark:text-white" />
            </div>
            Editar <span className="bg-white dark:bg-black px-2 border-2 border-black dark:border-white">{user.tipo}</span>
          </DialogTitle>
          <DialogDescription className="text-black/70 dark:text-white/70 font-bold text-xs uppercase tracking-wide mt-1">
            Atualize os dados de <span className="font-black text-black dark:text-white">{user.nome_completo}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="neo-dialog-content">
          <div className="space-y-4 p-4 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950">
            <div className="space-y-1.5">
              <Label htmlFor="nome_completo" className="text-xs font-bold uppercase dark:text-white">Nome Completo *</Label>
              <Input
                id="nome_completo"
                value={formData.nome_completo || ''}
                onChange={handleInputChange('nome_completo')}
                required
                className="neo-input h-10 uppercase placeholder:normal-case font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase dark:text-white">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange('email')}
                required
                className={cn(
                  "neo-input h-10 font-mono text-sm",
                  emailError && "border-red-600 bg-red-50"
                )}
              />
              {emailError && <p className="text-xs font-bold uppercase text-red-600 border border-red-600 p-1 bg-red-100 w-fit">{emailError}</p>}
            </div>

            {user.tipo === 'Aluno' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="ra" className="text-xs font-bold uppercase dark:text-white">RA (Registro do Aluno)</Label>
                  <Input
                    id="ra"
                    value={formData.ra || ''}
                    onChange={handleInputChange('ra')}
                    placeholder="RA"
                    className="neo-input h-10 uppercase placeholder:normal-case"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="turma" className="text-xs font-bold uppercase dark:text-white">Turma</Label>
                  <Input
                    id="turma"
                    value={formData.turma || ''}
                    onChange={handleInputChange('turma')}
                    placeholder="TURMA"
                    className="neo-input h-10 uppercase placeholder:normal-case"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="neo-dialog-footer">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="neo-btn-lg bg-white dark:bg-zinc-800 text-black dark:text-white flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !!emailError}
              className="neo-btn-yellow flex-[2]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}