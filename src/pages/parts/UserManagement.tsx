import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "@/hooks/use-toast";
import { useProfileRole } from '@/hooks/use-profile-role'; // Importando useProfileRole

// Importando todos os componentes de UI necessários
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Loader2, Trash2, AlertTriangle, User, Edit3, Save } from "lucide-react";
import { GlassCard } from '@/components/ui/GlassCard'; // Importando GlassCard
import { cn } from '@/lib/utils'; // Importando cn para classes condicionais
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Adicionando importação do Dialog

type UserProfile = {
  id: string;
  email: string;
  name: string | null; // Adicionado
  role: 'admin' | 'user' | 'super_admin'; // Adicionado super_admin
  last_sign_in_at: string | null;
};

// NOVO COMPONENTE: Diálogo de Edição de Perfil de Usuário (Auth)
interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onSuccess: () => void;
}

const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({ open, onOpenChange, user, onSuccess }) => {
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState<'admin' | 'user' | 'super_admin'>(user?.role || 'user');
  const [isSaving, setIsSaving] = useState(false);
  const { isAdmin, role: currentRole } = useProfileRole();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setRole(user.role);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      // 1. Atualizar o nome na tabela profiles
      const { error: nameError } = await supabase
        .from('profiles')
        .update({ name: name.trim() || null })
        .eq('id', user.id);
      
      if (nameError) throw nameError;

      // 2. Atualizar a role (apenas se o usuário logado for admin/super_admin e não estiver editando a si mesmo)
      if (isAdmin && user.id !== supabase.auth.getUser().id) {
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

  const canEditRole = isAdmin && user.id !== supabase.auth.getUser().id;
  const canSetSuperAdmin = currentRole === 'super_admin';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Perfil de Acesso
          </DialogTitle>
          <DialogDescription>
            Atualize o nome e a função de acesso para {user.email}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome de Exibição</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome Completo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail (Não Editável)</Label>
            <Input id="email" value={user.email} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Função de Acesso</Label>
            <Select value={role} onValueChange={(v: 'admin' | 'user' | 'super_admin') => setRole(v)} disabled={!canEditRole || isSaving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Padrão (Apenas Empréstimo/Devolução)</SelectItem>
                <SelectItem value="admin">Admin (Gerenciamento de Inventário e Usuários)</SelectItem>
                {canSetSuperAdmin && <SelectItem value="super_admin">Super Admin (Acesso Total)</SelectItem>}
              </SelectContent>
            </Select>
            {!canEditRole && <p className="text-xs text-muted-foreground mt-1">Você não pode editar sua própria função ou não tem permissão de administrador.</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
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
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeletePendingOpen, setIsDeletePendingOpen] = useState(false);
  const [pendingInviteToDelete, setPendingInviteToDelete] = useState<UserProfile | null>(null);
  
  // Estados para edição de perfil
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [userToEditProfile, setUserToEditProfile] = useState<UserProfile | null>(null);


  const sendInvite = async (email: string, role: 'admin' | 'user') => {
    if (!email) {
      toast({ title: 'Informe um e-mail', description: 'O campo de e-mail não pode estar vazio.', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.functions.invoke('invite-user', {
        body: { email, role },
      });
      if (error) {
        // Tenta extrair a mensagem de erro detalhada da resposta da função Edge
        let errorMessage = error.message;
        try {
          const errorBody = JSON.parse(error.message);
          errorMessage = errorBody.error || error.message;
        } catch {
          // Se não for JSON, usa a mensagem padrão
        }
        throw new Error(errorMessage);
      }
      toast({ title: 'Convite enviado!', description: `O convite foi enviado com sucesso para ${email}.` });
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
    } catch (e: any) {
      toast({ title: 'Erro no convite', description: e.message || 'Ocorreu um erro ao enviar o convite.', variant: 'destructive' });
    }
  };

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
      const { error } = await supabase.functions.invoke('delete-user', { body: { userId: userToDelete.id } });
      if (error) throw error;
      toast({ title: "Sucesso!", description: `Usuário ${userToDelete.email} foi excluído.` });
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
    } catch (error: any) {
      toast({ title: "Erro!", description: `Não foi possível excluir o usuário: ${error.message}`, variant: "destructive" });
    } finally {
      setUserToDelete(null);
    }
  };
  
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
        role: u.role as 'admin' | 'user' | 'super_admin'
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

  const pendingUsers = allUsers.filter((user) => user.last_sign_in_at === null);
  const activeUsers = allUsers.filter((user) => user.last_sign_in_at !== null);

  return (
    <div className="space-y-6">
      <GlassCard>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Envie convites e gerencie as permissões.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
              <div>
                <Label htmlFor="inviteEmail">Convidar novo usuário</Label>
                <Input id="inviteEmail" placeholder="email@exemplo.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              </div>
              <div>
                <Label>Função</Label>
                <Select value={inviteRole} onValueChange={(v: 'admin' | 'user') => setInviteRole(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Padrão</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => sendInvite(inviteEmail, inviteRole)} disabled={isLoading || !inviteEmail}>
                Enviar Convite
              </Button>
            </div>
          </div>
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Convites Pendentes <Badge variant="secondary">{pendingUsers.length}</Badge></CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingUsers.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum convite pendente.</p> :
            pendingUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-black/5">
                <p className="text-sm font-medium">{user.email}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => sendInvite(user.email, user.role as 'admin' | 'user')}>Reenviar</Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:text-red-800"
                    onClick={() => {
                      setPendingInviteToDelete(user);
                      setIsDeletePendingOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          }
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Usuários Ativos <Badge>{activeUsers.length}</Badge></CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-black/5">
              <div>
                <p className="text-sm font-medium">{user.name || 'Nome não definido'}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn(
                    user.role === 'super_admin' && 'bg-purple-100 text-purple-800 border-purple-300',
                    user.role === 'admin' && 'bg-blue-100 text-blue-800 border-blue-300',
                    user.role === 'user' && 'bg-gray-100 text-gray-800 border-gray-300',
                    'capitalize'
                )}>
                    {user.role.replace('_', ' ')}
                </Badge>
                
                {currentUser && user.id !== currentUser.id ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                  <Button variant="ghost" size="sm" onClick={() => handleEditProfile(user)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </GlassCard>

      {/* Diálogo de Confirmação para Usuários Ativos */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a conta do usuário <span className="font-bold">{userToDelete?.email}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteUserConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo de Confirmação para Convites Pendentes */}
      <AlertDialog open={isDeletePendingOpen} onOpenChange={setIsDeletePendingOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Convite Pendente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o convite enviado para <span className="font-bold">{pendingInviteToDelete?.email}</span>? O usuário não poderá mais se registrar com este link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter Convite</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeletePendingInviteConfirm}>
              <Trash2 className="h-4 w-4 mr-2" />
              Cancelar Convite
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
      />
    </div>
  );
};