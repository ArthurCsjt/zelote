import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Save, User, GraduationCap, Briefcase } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';

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

  const DOMAIN_SUFFIX_ALUNO = '@sj.g12.br';
  const DOMAIN_SUFFIX_PROFESSOR = '@sj.pro.br';
  const DOMAIN_SUFFIX_FUNCIONARIO = '@colegiosaojudas.com.br';

  const validateEmail = (email: string, type: UserData['tipo']) => {
    let requiredSuffix = '';
    switch (type) {
      case 'Aluno':
        requiredSuffix = DOMAIN_SUFFIX_ALUNO;
        break;
      case 'Professor':
        requiredSuffix = DOMAIN_SUFFIX_PROFESSOR;
        break;
      case 'Funcionário':
        requiredSuffix = DOMAIN_SUFFIX_FUNCIONARIO;
        break;
    }

    if (!email.endsWith(requiredSuffix)) {
      setEmailError(`E-mail deve terminar com ${requiredSuffix}`);
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
      <DialogContent className="sm:max-w-[500px] w-[95vw]"> {/* Adicionando w-[95vw] para mobile */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            Editar {user.tipo}
          </DialogTitle>
          <DialogDescription>
            Atualize os dados de {user.nome_completo}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_completo">Nome Completo *</Label>
            <Input 
              id="nome_completo" 
              value={formData.nome_completo || ''} 
              onChange={handleInputChange('nome_completo')} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input 
              id="email" 
              type="email" 
              value={formData.email || ''} 
              onChange={handleInputChange('email')} 
              required 
              className={emailError ? 'border-destructive' : ''}
            />
            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
          </div>

          {user.tipo === 'Aluno' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="ra">RA (Registro do Aluno)</Label>
                <Input 
                  id="ra" 
                  value={formData.ra || ''} 
                  onChange={handleInputChange('ra')} 
                  placeholder="RA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="turma">Turma</Label>
                <Input 
                  id="turma" 
                  value={formData.turma || ''} 
                  onChange={handleInputChange('turma')} 
                  placeholder="Turma"
                />
              </div>
            </>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !!emailError}>
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