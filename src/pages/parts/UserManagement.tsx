import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "@/hooks/use-toast";

// Importando todos os componentes de UI necessários
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Loader2 } from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  last_sign_in_at: string | null;
};

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const sendInvite = async (email: string, role: 'admin' | 'user') => {
    if (!email) {
      toast({ title: 'Informe um e-mail', description: 'O campo de e-mail não pode estar vazio.', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.functions.invoke('invite-user', {
        body: { email, role },
      });
      if (error) throw error;
      toast({ title: 'Convite enviado!', description: `O convite foi enviado com sucesso para ${email}.` });
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
    } catch (e: any) {
      toast({ title: 'Erro no convite', description: e.message || 'Ocorreu um erro ao enviar o convite.', variant: 'destructive' });
    }
  };

  const updateRole = async (id: string, role: 'admin' | 'user') => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil atualizado', description: 'Função alterada com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
    }
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

  const { data: allUsers = [], isLoading, error } = useQuery<UserProfile[]>({
    queryKey: ['all_users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_users');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando usuários...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500 bg-red-50">
        <CardContent className="pt-6"><p className="text-red-700">Erro ao carregar usuários: {error.message}</p></CardContent>
      </Card>
    );
  }

  const pendingUsers = allUsers.filter((user) => user.last_sign_in_at === null);
  const activeUsers = allUsers.filter((user) => user.last_sign_in_at !== null);

  return (
    <div className="space-y-6">
      <Card className="glass-card">
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
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Convites Pendentes <Badge variant="secondary">{pendingUsers.length}</Badge></CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingUsers.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum convite pendente.</p> :
            pendingUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-black/5">
                <p className="text-sm font-medium">{user.email}</p>
                <Button variant="outline" size="sm" onClick={() => sendInvite(user.email, user.role)}>Reenviar</Button>
              </div>
            ))
          }
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Usuários Ativos <Badge>{activeUsers.length}</Badge></CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-black/5">
              <div>
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">Último acesso: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="flex items-center gap-2">
                {currentUser && user.id !== currentUser.id ? (
                  <>
                    <Select value={user.role} onValueChange={(newRole: 'admin' | 'user') => updateRole(user.id, newRole)}>
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Padrão</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => setUserToDelete(user)}>
                          Excluir Usuário
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <Badge variant="outline">Você</Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

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
    </div>
  );
};