import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { validatePassword } from '@/utils/passwordValidation';
import {
  User,
  Shield,
  KeyRound,
  Save,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserProfileCard() {
  const { user } = useAuth();
  const { role } = useProfileRole();

  // Profile data states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Password update states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Fetch current profile details
  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, name')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
        }
      } catch (err: any) {
        console.error('Erro ao carregar perfil:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSavingProfile(true);
    try {
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const fullName = [trimmedFirst, trimmedLast].filter(Boolean).join(' ');

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: trimmedFirst || null,
          last_name: trimmedLast || null,
          name: fullName || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Perfil Atualizado',
        description: 'Seus dados foram atualizados com sucesso.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: err.message || 'Ocorreu um erro ao salvar.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Senhas não coincidem',
        description: 'A nova senha e a confirmação devem ser idênticas.',
        variant: 'destructive',
      });
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast({
        title: 'Senha fraca',
        description: 'A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: 'Senha alterada com sucesso',
        description: 'Sua nova senha de acesso já está em vigor.',
        variant: 'success',
      });
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err: any) {
      toast({
        title: 'Erro ao alterar senha',
        description: err.message || 'Não foi possível atualizar a senha.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const passwordVal = validatePassword(newPassword);

  const getRoleLabel = () => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Administrador', color: 'bg-purple-600 text-white' };
      case 'admin':
        return { label: 'Administrador', color: 'bg-blue-600 text-white' };
      case 'professor':
        return { label: 'Professor', color: 'bg-emerald-600 text-white' };
      case 'manutencao':
        return { label: 'Manutenção / TI', color: 'bg-amber-500 text-black' };
      default:
        return { label: 'Operador / Funcionário', color: 'bg-zinc-800 text-white' };
    }
  };

  const roleInfo = getRoleLabel();
  const initials = (firstName && lastName)
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : user?.email ? user.email.slice(0, 2).toUpperCase() : 'US';

  return (
    <div className="space-y-6">
      {/* 1. Header do Perfil com Avatar e Badge */}
      <div className="neo-card p-6 bg-white dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-primary text-white flex items-center justify-center font-black text-2xl border-3 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">
                  {[firstName, lastName].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'Usuário'}
                </h3>
                <span className={cn("inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-0.5 border border-black shadow-[2px_2px_0px_0px_#000]", roleInfo.color)}>
                  <Shield className="h-3 w-3" />
                  {roleInfo.label}
                </span>
              </div>
              <p className="text-sm font-bold text-muted-foreground mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-zinc-100 dark:bg-zinc-800/80 px-3 py-2 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]">
            <Clock className="h-4 w-4 text-primary" />
            <span>Último Acesso: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Hoje'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Formulário de Informações Pessoais */}
        <div className="neo-card p-6 bg-white dark:bg-zinc-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-4 border-b-2 border-black/10 dark:border-white/10 mb-4">
              <div className="p-2 bg-blue-500 text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-black uppercase tracking-tight">Dados Cadastrais</h4>
                <p className="text-xs font-bold text-muted-foreground uppercase">Atualize seu nome de exibição no Zelote</p>
              </div>
            </div>

            {isLoadingProfile ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="user-first-name" className="text-xs font-black uppercase tracking-wider">
                      Nome
                    </Label>
                    <Input
                      id="user-first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ex: Carlos"
                      className="neo-input h-10 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="user-last-name" className="text-xs font-black uppercase tracking-wider">
                      Sobrenome
                    </Label>
                    <Input
                      id="user-last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ex: Silva"
                      className="neo-input h-10 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="user-email-readonly" className="text-xs font-black uppercase tracking-wider">
                    E-mail Institucional (Bloqueado)
                  </Label>
                  <Input
                    id="user-email-readonly"
                    value={user?.email || ''}
                    disabled
                    readOnly
                    className="neo-input h-10 bg-zinc-100 dark:bg-zinc-800 opacity-70 cursor-not-allowed font-medium"
                  />
                  <p className="text-[11px] font-bold text-muted-foreground">
                    O e-mail é gerenciado pela instituição e não pode ser alterado diretamente.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider">
                    Nível de Acesso Atribuído
                  </Label>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-black/20 dark:border-white/20 font-bold text-xs uppercase flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>{roleInfo.label}</span>
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="pt-4 mt-6 border-t-2 border-black/10 dark:border-white/10">
            <Button
              type="submit"
              form="profile-form"
              disabled={isSavingProfile || isLoadingProfile}
              className="neo-btn bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-wider w-full h-11 shadow-[3px_3px_0px_0px_#000]"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando Dados...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Salvar Alterações do Perfil
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 3. Formulário de Troca de Senha */}
        <div className="neo-card p-6 bg-white dark:bg-zinc-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-4 border-b-2 border-black/10 dark:border-white/10 mb-4">
              <div className="p-2 bg-amber-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-black uppercase tracking-tight">Segurança & Senha</h4>
                <p className="text-xs font-bold text-muted-foreground uppercase">Defina uma nova senha de acesso</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="p-3 mb-4 bg-green-500 text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] font-black uppercase text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Senha atualizada com sucesso!
              </div>
            )}

            <form id="password-form" onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-password" className="text-xs font-black uppercase tracking-wider">
                    Nova Senha
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres com símbolos"
                  className="neo-input h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-new-password" className="text-xs font-black uppercase tracking-wider">
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirm-new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="neo-input h-10"
                />
              </div>

              {/* Indicadores de Requisitos da Senha */}
              {newPassword.length > 0 && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] space-y-1.5 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", passwordVal.hasMinLength ? "bg-green-500" : "bg-red-500")} />
                    <span className={passwordVal.hasMinLength ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
                      Mínimo de 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", passwordVal.hasUpperCase && passwordVal.hasLowerCase ? "bg-green-500" : "bg-red-500")} />
                    <span className={passwordVal.hasUpperCase && passwordVal.hasLowerCase ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
                      Letras maiúsculas e minúsculas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", passwordVal.hasNumber ? "bg-green-500" : "bg-red-500")} />
                    <span className={passwordVal.hasNumber ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
                      Pelo menos um número
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", passwordVal.hasSpecialChar ? "bg-green-500" : "bg-red-500")} />
                    <span className={passwordVal.hasSpecialChar ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
                      Caractere especial (!@#$%...)
                    </span>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="pt-4 mt-6 border-t-2 border-black/10 dark:border-white/10">
            <Button
              type="submit"
              form="password-form"
              disabled={isUpdatingPassword || !newPassword || !passwordVal.isValid}
              className="neo-btn bg-amber-400 hover:bg-amber-500 text-black font-black uppercase tracking-wider w-full h-11 shadow-[3px_3px_0px_0px_#000]"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Atualizando Senha...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 mr-2" /> Alterar Minha Senha
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
