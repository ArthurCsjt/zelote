import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

export const UserManagement = () => {
  const [profiles, setProfiles] = useState<Array<{ id: string; email: string; name?: string | null; role: 'admin' | 'user' }>>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role')
        .order('created_at', { ascending: false });
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        setProfiles((data || []) as any);
      }
      setLoading(false);
    };
    load();
  }, []);

  const updateRole = async (id: string, role: 'admin' | 'user') => {
    const prev = profiles;
    setProfiles(prev.map(p => (p.id === id ? { ...p, role } : p)));
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      setProfiles(prev);
    } else {
      toast({ title: 'Perfil atualizado', description: 'Função alterada com sucesso.' });
    }
  };

  const invite = async () => {
    if (!inviteEmail) {
      toast({ title: 'Informe um e-mail', description: 'Digite o e-mail do usuário a convidar.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail, role: inviteRole },
      });
      if (error) throw error;
      toast({ title: 'Convite enviado', description: 'O usuário receberá um e-mail para completar o cadastro.' });
      setInviteEmail('');
    } catch (e: any) {
      toast({ title: 'Configuração necessária', description: 'Precisamos configurar a Service Role Key nas funções. Fale comigo que configuro já.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
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
            <Button onClick={invite} disabled={loading}>Enviar Convite</Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="grid grid-cols-1 gap-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : profiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
            ) : (
              profiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{p.name || p.email}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <div className="w-40">
                    <Select value={p.role} onValueChange={(v: any) => updateRole(p.id, v)}>
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
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};