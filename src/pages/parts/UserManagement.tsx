import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "@/hooks/use-toast";
import { useProfileRole, type ProfileRole } from '@/hooks/use-profile-role'; // Importando useProfileRole

// Importando todos os componentes de UI necessários
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Loader2, Trash2, AlertTriangle, User, Edit3, Save, Search, Filter, Plus, Trash, Mail, UserCheck } from "lucide-react";
import { GlassCard } from '@/components/ui/GlassCard'; // Importando GlassCard
import { cn } from '@/lib/utils'; // Importando cn para classes condicionais
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Adicionando importação do Dialog
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { User as AuthUser } from '@supabase/supabase-js'; // Importando o tipo User do Supabase

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: ProfileRole;
  last_sign_in_at: string | null;
};

// NOVO COMPONENTE: Diálogo de Edição de Perfil de Usuário (Auth)
interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onSuccess: () => void;
  currentUser: AuthUser | null; // Adicionando o usuário logado
}

const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({ open, onOpenChange, user, onSuccess, currentUser }) => {
  const [name, setName] = useState(user?.name || '');
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [role, setRole] = useState<ProfileRole>(user?.role || 'user');
  const [isSaving, setIsSaving] = useState(false);
  const { isAdmin, role: currentRole } = useProfileRole();

  useEffect(() => {
    if (user) {
      // Inicializa o estado com o valor atual do usuário
      setName(user.name || '');
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setRole(user.role);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || !currentUser) return;
    setIsSaving(true);

    try {
      // 1. Atualizar o nome na tabela profiles
      const { error: nameError } = await supabase
        .from('profiles')
        .update({
          name: name.trim() || null,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null
        })
        .eq('id', user.id);

      if (nameError) throw nameError;

      // 2. Atualizar a role (apenas se o usuário logado for admin/super_admin e não estiver editando a si mesmo)
      if (isAdmin && user.id !== currentUser.id) {
        // Super admin pode definir qualquer role, Admin só pode definir 'user' ou 'admin'
        const roleToSet = (currentRole === 'admin' && role === 'super_admin') ? 'admin' : role;

        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: roleToSet })
          .eq('id', user.id);

        if (roleError) throw roleError;
      }

      toast({ title: 'Sucesso', description: 'Perfil atualizado.' });
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  // Usando currentUser.id para comparação síncrona
  const canEditRole = isAdmin && user.id !== currentUser?.id;
  const canSetSuperAdmin = currentRole === 'super_admin';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-dialog sm:max-w-[450px]">
        <DialogHeader className="neo-dialog-header-violet">
          <DialogTitle className="neo-dialog-title">
            <User className="h-5 w-5" />
            Editar Perfil de Acesso
          </DialogTitle>
          <DialogDescription className="text-black/80 dark:text-white/80 font-bold uppercase text-xs mt-1">
            Atualize o nome e a função de acesso para {user.email}.
          </DialogDescription>
        </DialogHeader>
        <div className="neo-dialog-content">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-xs font-bold uppercase">Nome</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="neo-input h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-xs font-bold uppercase">Sobrenome</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="neo-input h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase">Nome de Exibição (Combinado)</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome Completo" className="neo-input h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase">E-mail (Não Editável)</Label>
            <Input id="email" value={user.email} readOnly disabled className="neo-input h-10 opacity-60" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" className="text-xs font-bold uppercase">Função de Acesso</Label>
            <Select value={role || 'user'} onValueChange={(v: ProfileRole) => setRole(v)} disabled={!canEditRole || isSaving}>
              <SelectTrigger className="neo-input h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-3 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <SelectItem value="user" className="font-bold uppercase text-xs">Padrão (Apenas Empréstimo/Devolução)</SelectItem>
                <SelectItem value="manutencao" className="font-bold uppercase text-xs">Manutenção (Apenas Agendamento)</SelectItem>
                <SelectItem value="admin" className="font-bold uppercase text-xs">Admin (Gerenciamento de Inventário e Usuários)</SelectItem>
                {canSetSuperAdmin && <SelectItem value="super_admin" className="font-bold uppercase text-xs">Super Admin (Acesso Total)</SelectItem>}
              </SelectContent>
            </Select>
            {!canEditRole && <p className="text-xs text-muted-foreground mt-1 font-bold">Você não pode editar sua própria função ou não tem permissão de administrador.</p>}
          </div>
        </div>
        <DialogFooter className="neo-dialog-footer">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="neo-btn-lg h-11 bg-white dark:bg-zinc-800 text-black dark:text-white flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="neo-btn-violet h-11 flex-[2]">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { isAdmin, loading: roleLoading } = useProfileRole(); // Usando useProfileRole
  const queryClient = useQueryClient();
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  // Removendo estados de exclusão de pendentes, pois a seção será removida
  // const [isDeletePendingOpen, setIsDeletePendingOpen] = useState(false);
  // const [pendingInviteToDelete, setPendingInviteToDelete] = useState<UserProfile | null>(null);

  // Estados para edição de perfil
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [userToEditProfile, setUserToEditProfile] = useState<UserProfile | null>(null);

  // Search and filter state for active users
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Rules state
  const [newRuleEmail, setNewRuleEmail] = useState('');
  const [newRuleRole, setNewRuleRole] = useState<ProfileRole>('manutencao');
  const [isAddingRule, setIsAddingRule] = useState(false);

  // Load email rules
  const { data: emailRules = [], isLoading: isLoadingRules, refetch: refetchRules } = useQuery({
    queryKey: ['email_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_rules')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      return data || [];
    },
    enabled: isAdmin && !roleLoading,
  });


  const handleEditProfile = (user: UserProfile) => {
    setUserToEditProfile(user);
    setIsEditProfileOpen(true);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['all_users'] });
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    try {
      // Soft delete direto na tabela profiles
      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', userToDelete.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Usuário ${userToDelete.email} foi excluído.`,
        variant: "success"
      });

      queryClient.invalidateQueries({ queryKey: ['all_users'] });
    } catch (error: any) {
      toast({
        title: "Erro!",
        description: `Não foi possível excluir o usuário: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setUserToDelete(null);
    }
  };

  // Removendo função de exclusão de pendentes
  /*
  const handleDeletePendingInviteConfirm = async () => {
    if (!pendingInviteToDelete) return;
    try {
      const { error } = await supabase.functions.invoke('delete-user', { body: { userId: pendingInviteToDelete.id } });
      if (error) throw error;
      toast({ title: "Sucesso!", description: `Convite para ${pendingInviteToDelete.email} foi cancelado.` });
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
    } catch (error: any) {
      toast({ title: "Erro!", description: `Não foi possível cancelar o convite: ${error.message}`, variant: "destructive" });
    } finally {
      setPendingInviteToDelete(null);
      setIsDeletePendingOpen(false);
    }
  };
  */

  const { data: allUsers = [], isLoading, error } = useQuery<UserProfile[]>({
    queryKey: ['all_users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_users');
      if (error) {
        // Se o erro for de permissão, lançamos um erro específico
        if (error.message.includes('Unauthorized: Only admins or super_admins can access this function')) {
          throw new Error('Acesso negado: Seu perfil não tem permissão de administrador no banco de dados.');
        }
        throw new Error(error.message);
      }
      // Garantir que a role seja mapeada corretamente
      return (data || []).map(u => ({
        ...u,
        role: u.role as ProfileRole
      })) as UserProfile[];
    },
    // Desabilita a consulta se o usuário não for admin ou se o papel ainda estiver carregando
    enabled: isAdmin && !roleLoading,
    // Otimização de cache: mantém os dados 'frescos' por 5 minutos
    staleTime: 1000 * 60 * 5,
    // Não refaz a busca automaticamente ao focar na janela
    refetchOnWindowFocus: false,
  });

  if (roleLoading || isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando usuários...</p>
      </div>
    );
  }

  // Se não for admin, mas o componente foi renderizado (o que não deveria acontecer em Settings.tsx, mas como fallback)
  if (!isAdmin) {
    return (
      <Card className="border-red-500 bg-red-50">
        <CardContent className="pt-6 flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <p>Acesso negado. Você não tem permissão para gerenciar usuários.</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const isPermissionError = error.message.includes('Acesso negado: Seu perfil não tem permissão de administrador no banco de dados.');

    return (
      <Card className={cn("border-red-500 bg-red-50", isPermissionError ? 'border-l-4' : '')}>
        <CardContent className="pt-6 flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <p>{isPermissionError ? 'Acesso negado. Seu perfil não tem permissão de administrador no banco de dados.' : `Erro ao carregar usuários: ${error.message}`}</p>
        </CardContent>
      </Card>
    );
  }


  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleEmail.trim()) return;

    setIsAddingRule(true);
    try {
      const { error } = await supabase
        .from('email_rules')
        .insert({
          email: newRuleEmail.trim().toLowerCase(),
          role: newRuleRole
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Regra para ${newRuleEmail} adicionada com sucesso.`,
        variant: "success"
      });
      setNewRuleEmail('');
      refetchRules();
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
    } catch (err: any) {
      toast({
        title: "Erro ao adicionar regra",
        description: err.message || "Ocorreu um erro.",
        variant: "destructive"
      });
    } finally {
      setIsAddingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string, ruleEmail: string) => {
    try {
      const { error } = await supabase
        .from('email_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Regra para ${ruleEmail} removida com sucesso.`,
        variant: "success"
      });
      refetchRules();
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
    } catch (err: any) {
      toast({
        title: "Erro ao remover regra",
        description: err.message || "Ocorreu um erro.",
        variant: "destructive"
      });
    }
  };

  const activeUsers = allUsers.filter((user) => user.last_sign_in_at !== null);

  const filteredUsers = activeUsers.filter(user => {
    const matchesSearch = 
      (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const userKpis = {
    total: activeUsers.length,
    admins: activeUsers.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
    professores: activeUsers.filter(u => u.role === 'professor').length,
    manutencao: activeUsers.filter(u => u.role === 'manutencao').length,
    operadores: activeUsers.filter(u => u.role === 'user').length,
  };

  return (
    <div className="space-y-6">
      {/* 1. Regras de Exceção por E-mail (Preservado e Estilizado) */}
      <div className="neo-card p-6 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-3 pb-4 border-b-2 border-black/10 dark:border-white/10 mb-4">
          <div className="p-2.5 bg-violet-600 text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">Regras de Exceção por E-mail</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase">
              Atribuição automática de função ao realizar login institucional
            </p>
          </div>
        </div>

        <form onSubmit={handleAddRule} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-zinc-50 dark:bg-zinc-800/60 p-4 border-2 border-black/20 dark:border-white/20 mb-6">
          <div className="space-y-1.5">
            <Label htmlFor="rule-email" className="text-xs font-black uppercase tracking-wider">
              Endereço de E-mail
            </Label>
            <Input
              id="rule-email"
              type="email"
              placeholder="exemplo@colegiosaojudas.com.br"
              value={newRuleEmail}
              onChange={(e) => setNewRuleEmail(e.target.value)}
              required
              className="neo-input bg-white dark:bg-zinc-900 h-10 font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rule-role" className="text-xs font-black uppercase tracking-wider">
              Função Atribuída
            </Label>
            <Select value={newRuleRole || 'user'} onValueChange={(v: ProfileRole) => setNewRuleRole(v)}>
              <SelectTrigger id="rule-role" className="neo-input bg-white dark:bg-zinc-900 h-10 font-bold uppercase text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-3 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <SelectItem value="user" className="font-bold uppercase text-xs">Padrão (Operador / Funcionário)</SelectItem>
                <SelectItem value="manutencao" className="font-bold uppercase text-xs">Manutenção</SelectItem>
                <SelectItem value="professor" className="font-bold uppercase text-xs">Professor</SelectItem>
                <SelectItem value="admin" className="font-bold uppercase text-xs">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isAddingRule} className="neo-btn bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-wider w-full h-10 shadow-[3px_3px_0px_0px_#000]">
            {isAddingRule ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Cadastrar Exceção
          </Button>
        </form>

        {isLoadingRules ? (
          <div className="flex justify-center p-6"><Loader2 className="animate-spin h-6 w-6 text-violet-600" /></div>
        ) : emailRules.length === 0 ? (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-black/20 dark:border-white/20 text-center text-xs font-bold uppercase text-muted-foreground">
            Nenhuma regra de exceção de e-mail cadastrada no momento.
          </div>
        ) : (
          <div className="border-2 border-black dark:border-white overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-100 dark:bg-zinc-800">
                <TableRow className="border-b-2 border-black dark:border-white">
                  <TableHead className="font-black uppercase text-xs text-foreground">E-mail Institucional</TableHead>
                  <TableHead className="font-black uppercase text-xs text-foreground">Função / Categoria</TableHead>
                  <TableHead className="font-black uppercase text-xs text-foreground text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailRules.map((rule: any) => (
                  <TableRow key={rule.id} className="border-b border-black/10 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <TableCell className="font-bold text-sm">{rule.email}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 text-[11px] font-black uppercase border border-black shadow-[1px_1px_0px_0px_#000]",
                        rule.role === 'admin' && 'bg-blue-500 text-white',
                        rule.role === 'manutencao' && 'bg-amber-400 text-black',
                        rule.role === 'professor' && 'bg-emerald-500 text-white',
                        rule.role === 'user' && 'bg-zinc-800 text-white',
                      )}>
                        {rule.role === 'user' ? 'Operador' : rule.role?.replace('_', ' ') || 'Padrão'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteRule(rule.id, rule.email)}
                        className="hover:bg-red-50 dark:hover:bg-red-950 text-red-600 h-8 w-8 p-0"
                        title="Remover Regra de Exceção"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 2. Seção de Usuários Ativos */}
      <div className="neo-card p-6 bg-white dark:bg-zinc-900">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b-2 border-black/10 dark:border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black uppercase tracking-tight">Usuários do Sistema</h3>
                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-black border border-black shadow-[2px_2px_0px_0px_#000]">
                  {activeUsers.length}
                </span>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase">
                Operadores, professores e administradores cadastrados
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 neo-input bg-white dark:bg-zinc-900 text-xs font-medium"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-10 neo-input bg-white dark:bg-zinc-900 font-bold uppercase text-xs">
                  <SelectValue placeholder="Filtrar por Função" />
                </SelectTrigger>
                <SelectContent className="border-3 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <SelectItem value="all" className="font-bold uppercase text-xs">Todas as Funções</SelectItem>
                  <SelectItem value="super_admin" className="font-bold uppercase text-xs">Super Admin</SelectItem>
                  <SelectItem value="admin" className="font-bold uppercase text-xs">Admin</SelectItem>
                  <SelectItem value="manutencao" className="font-bold uppercase text-xs">Manutenção</SelectItem>
                  <SelectItem value="professor" className="font-bold uppercase text-xs">Professor</SelectItem>
                  <SelectItem value="user" className="font-bold uppercase text-xs">Operador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Mini KPIs de Usuários */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Administradores</p>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400">{userKpis.admins}</p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Professores</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{userKpis.professores}</p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Manutenção / TI</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400">{userKpis.manutencao}</p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Operadores</p>
            <p className="text-xl font-black text-zinc-700 dark:text-zinc-300">{userKpis.operadores}</p>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-black/20 dark:border-white/20 font-bold uppercase text-xs text-muted-foreground">
            Nenhum usuário encontrado para os filtros selecionados.
          </div>
        ) : (
          <>
            {/* Visualização Desktop em Tabela */}
            <div className="hidden md:block border-2 border-black dark:border-white overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-100 dark:bg-zinc-800">
                  <TableRow className="border-b-2 border-black dark:border-white">
                    <TableHead className="font-black uppercase text-xs text-foreground">Nome de Exibição</TableHead>
                    <TableHead className="font-black uppercase text-xs text-foreground">E-mail</TableHead>
                    <TableHead className="font-black uppercase text-xs text-foreground">Função</TableHead>
                    <TableHead className="font-black uppercase text-xs text-foreground">Último Acesso</TableHead>
                    <TableHead className="font-black uppercase text-xs text-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id} className="border-b border-black/10 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <TableCell className="font-bold text-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-700 text-foreground flex items-center justify-center font-black text-xs border border-black dark:border-white shadow-[1px_1px_0px_0px_#000]">
                            {user.name ? user.name.substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{user.name || 'Sem nome definido'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 text-[11px] font-black uppercase border border-black shadow-[1px_1px_0px_0px_#000]",
                          user.role === 'super_admin' && 'bg-purple-600 text-white',
                          user.role === 'admin' && 'bg-blue-600 text-white',
                          user.role === 'manutencao' && 'bg-amber-400 text-black',
                          user.role === 'professor' && 'bg-emerald-600 text-white',
                          user.role === 'user' && 'bg-zinc-800 text-white',
                        )}>
                          {user.role === 'user' ? 'Operador' : user.role?.replace('_', ' ') || 'Padrão'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground">
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Nunca logou'}
                      </TableCell>
                      <TableCell className="text-right">
                        {currentUser && user.id !== currentUser.id ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 border border-black/30 hover:border-black">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-3 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <DropdownMenuLabel className="font-black uppercase text-xs">Ações do Usuário</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer flex items-center gap-2 font-bold text-xs uppercase" onClick={() => handleEditProfile(user)}>
                                <Edit3 className="h-4 w-4" />
                                Editar Perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer flex items-center gap-2 font-bold text-xs uppercase" onClick={() => setUserToDelete(user)}>
                                <Trash2 className="h-4 w-4" />
                                Excluir Usuário
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleEditProfile(user)} className="h-8 px-2 font-bold uppercase text-[11px] border border-black dark:border-white">
                            <Edit3 className="h-3.5 w-3.5 mr-1" /> Editar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Visualização Mobile em Cards Responsivos */}
            <div className="block md:hidden space-y-3">
              {filteredUsers.map(user => (
                <div key={user.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/70 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 bg-zinc-200 dark:bg-zinc-700 text-foreground flex items-center justify-center font-black text-xs border border-black dark:border-white shadow-[1px_1px_0px_0px_#000] shrink-0">
                        {user.name ? user.name.substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase text-foreground">{user.name || 'Sem nome'}</p>
                        <p className="text-xs text-muted-foreground font-medium truncate max-w-[200px]">{user.email}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase border border-black shadow-[1px_1px_0px_0px_#000]",
                      user.role === 'super_admin' && 'bg-purple-600 text-white',
                      user.role === 'admin' && 'bg-blue-600 text-white',
                      user.role === 'manutencao' && 'bg-amber-400 text-black',
                      user.role === 'professor' && 'bg-emerald-600 text-white',
                      user.role === 'user' && 'bg-zinc-800 text-white',
                    )}>
                      {user.role === 'user' ? 'Operador' : user.role?.replace('_', ' ') || 'Padrão'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground pt-2 border-t border-black/10 dark:border-white/10">
                    <span>Acesso: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') : 'Nunca'}</span>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => handleEditProfile(user)} className="h-7 px-2 font-bold text-[10px] uppercase border border-black">
                        <Edit3 className="h-3 w-3 mr-1" /> Editar
                      </Button>
                      {currentUser && user.id !== currentUser.id && (
                        <Button variant="destructive" size="sm" onClick={() => setUserToDelete(user)} className="h-7 px-2 font-bold text-[10px] uppercase border border-black bg-red-600">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Diálogo de Confirmação para Usuários Ativos */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="border-3 border-black dark:border-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-xl uppercase tracking-wider text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Você tem certeza absoluta?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-black/80 dark:text-white/80 font-medium">
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a conta do usuário <span className="font-bold text-red-600">{userToDelete?.email}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="neo-btn h-10">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90 neo-btn h-10 border-red-700 bg-red-600" onClick={handleDeleteUserConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Edição de Perfil */}
      <ProfileEditDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        user={userToEditProfile}
        onSuccess={handleEditSuccess}
        currentUser={currentUser}
      />
    </div>
  );
};