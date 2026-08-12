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

  return (
    <div className="space-y-6">
      <GlassCard>
        <CardHeader>
          <CardTitle>Gerenciamento de Acesso</CardTitle>
          <CardDescription>
            Gerencie as funções de acesso (roles) dos usuários e configure regras de redirecionamento/atribuição automática de e-mails.
          </CardDescription>
        </CardHeader>
      </GlassCard>

      {/* NOVO: Regras de Redirecionamento por E-mail */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-500" />
            Regras de Redirecionamento de E-mail
          </CardTitle>
          <CardDescription>
            Cadastre e-mails para que, ao se registrarem ou logarem, sejam automaticamente direcionados a uma função de acesso específica (ex: Manutenção, Professor).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAddRule} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-black/5 p-4 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="rule-email" className="text-xs font-bold uppercase">Endereço de E-mail</Label>
              <Input
                id="rule-email"
                type="email"
                placeholder="usuario@dominio.com"
                value={newRuleEmail}
                onChange={(e) => setNewRuleEmail(e.target.value)}
                required
                className="neo-input bg-white dark:bg-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-role" className="text-xs font-bold uppercase">Função / Categoria</Label>
              <Select value={newRuleRole || 'user'} onValueChange={(v: ProfileRole) => setNewRuleRole(v)}>
                <SelectTrigger id="rule-role" className="neo-input bg-white dark:bg-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-3 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <SelectItem value="user" className="font-bold uppercase text-xs">Padrão (Aluno/Funcionário)</SelectItem>
                  <SelectItem value="manutencao" className="font-bold uppercase text-xs">Manutenção</SelectItem>
                  <SelectItem value="professor" className="font-bold uppercase text-xs">Professor</SelectItem>
                  <SelectItem value="admin" className="font-bold uppercase text-xs">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isAddingRule} className="neo-btn-violet w-full h-10">
              {isAddingRule ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Adicionar Regra
            </Button>
          </form>

          {isLoadingRules ? (
            <div className="flex justify-center p-6"><Loader2 className="animate-spin h-6 w-6 text-indigo-500" /></div>
          ) : emailRules.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">Nenhuma regra de e-mail cadastrada.</p>
          ) : (
            <div className="border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-black/5 dark:bg-white/5">
                  <TableRow>
                    <TableHead className="font-bold">E-mail</TableHead>
                    <TableHead className="font-bold">Categoria Atribuída</TableHead>
                    <TableHead className="font-bold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailRules.map((rule: any) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium text-sm">{rule.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          rule.role === 'admin' && 'bg-blue-100 text-blue-800 border-blue-300',
                          rule.role === 'manutencao' && 'bg-amber-100 text-amber-800 border-amber-300',
                          rule.role === 'professor' && 'bg-green-100 text-green-800 border-green-300',
                          rule.role === 'user' && 'bg-gray-100 text-gray-800 border-gray-300',
                          'capitalize'
                        )}>
                          {rule.role?.replace('_', ' ') || 'Padrão'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteRule(rule.id, rule.email)}
                          className="hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0"
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
        </CardContent>
      </GlassCard>

      {/* Seção de Usuários Ativos (Layout Aprimorado em Colunas) */}
      <GlassCard>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-500" />
              Usuários Ativos 
              <Badge className="bg-indigo-600 text-white font-bold">{activeUsers.length}</Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              Lista de todos os usuários ativos no sistema organizados por colunas.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 neo-input bg-white dark:bg-zinc-800"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9 neo-input bg-white dark:bg-zinc-800">
                  <SelectValue placeholder="Filtrar por Função" />
                </SelectTrigger>
                <SelectContent className="border-3 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <SelectItem value="all" className="font-bold uppercase text-xs">Todas as Funções</SelectItem>
                  <SelectItem value="super_admin" className="font-bold uppercase text-xs">Super Admin</SelectItem>
                  <SelectItem value="admin" className="font-bold uppercase text-xs">Admin</SelectItem>
                  <SelectItem value="manutencao" className="font-bold uppercase text-xs">Manutenção</SelectItem>
                  <SelectItem value="professor" className="font-bold uppercase text-xs">Professor</SelectItem>
                  <SelectItem value="user" className="font-bold uppercase text-xs">Padrão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum usuário ativo encontrado para os filtros selecionados.</p>
          ) : (
            <div className="border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-black/5 dark:bg-white/5">
                  <TableRow>
                    <TableHead className="font-bold">Nome</TableHead>
                    <TableHead className="font-bold">E-mail</TableHead>
                    <TableHead className="font-bold">Função</TableHead>
                    <TableHead className="font-bold">Último Acesso</TableHead>
                    <TableHead className="font-bold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs uppercase">
                            {user.name ? user.name.substring(0, 2) : 'U'}
                          </div>
                          <span>{user.name || 'Nome não definido'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          user.role === 'super_admin' && 'bg-purple-100 text-purple-800 border-purple-300',
                          user.role === 'admin' && 'bg-blue-100 text-blue-800 border-blue-300',
                          user.role === 'manutencao' && 'bg-amber-100 text-amber-800 border-amber-300',
                          user.role === 'professor' && 'bg-green-100 text-green-800 border-green-300',
                          user.role === 'user' && 'bg-gray-100 text-gray-800 border-gray-300',
                          'capitalize'
                        )}>
                          {user.role?.replace('_', ' ') || 'Padrão'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
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
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-3 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer flex items-center gap-2" onClick={() => handleEditProfile(user)}>
                                <Edit3 className="h-4 w-4" />
                                Editar Perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer flex items-center gap-2" onClick={() => setUserToDelete(user)}>
                                <Trash2 className="h-4 w-4" />
                                Excluir Usuário
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => handleEditProfile(user)} className="h-8 w-8 p-0">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </GlassCard>

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