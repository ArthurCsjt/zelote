import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// Importando todos os componentes de UI necessários
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// TIPO DEFINIDO PARA SEGURANÇA E PREVISIBILIDADE DO CÓDIGO
type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  last_sign_in_at: string | null;
};

export const UserManagement = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');
  const queryClient = useQueryClient();

  // FUNÇÃO UNIFICADA E REUTILIZÁVEL PARA ENVIAR/REENVIAR CONVITES
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
      setInviteEmail(''); // Limpa o campo principal após o envio
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

  const { data: allUsers = [], isLoading, error } = useQuery<UserProfile[]>({
    queryKey: ['all_users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_users');
      if (error) throw error;
      return data || [];
    },
  });

  if (error) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">Erro ao carregar usuários: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const pendingUsers = allUsers.filter((user) => user.last_sign_in_at === null);
  const activeUsers = allUsers.filter((user) => user.last_sign_in_at !== null);

  return (
    <div className="space-y-6">
      {/* Card de convite */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3">
            <div>
              <Label htmlFor="inviteEmail">Convidar usuário por e-mail</Label>
              <Input id="inviteEmail" placeholder="email@exemplo.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div>
              <Label>Função</Label>
              <Select value={inviteRole} onValueChange={(v: 'admin' | 'user') => setInviteRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Padrão</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => sendInvite(inviteEmail, inviteRole)} disabled={isLoading}>Enviar Convite</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Convites Pendentes */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Convites Pendentes
            <Badge variant="secondary">{pendingUsers.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : pendingUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum convite pendente.</p>
          ) : (
            <div className="space-y-2">
              {pendingUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Pendente</Badge>
                    <Button variant="outline" size="sm" onClick={() => sendInvite(user.email, user.role)}>
                      Reenviar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usuários Ativos */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Usuários Ativos
            <Badge variant="default">{activeUsers.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : activeUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário ativo.</p>
          ) : (
            <div className="space-y-2">
              {activeUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    {user.name && <p className="text-xs text-muted-foreground">{user.email}</p>}
                    {user.last_sign_in_at && (
                      <p className="text-xs text-muted-foreground">
                        Último acesso: {new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="w-40">
                    <Select value={user.role} onValueChange={(v: 'admin' | 'user') => updateRole(user.id, v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Padrão</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};