import { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useNavigate } from 'react-router-dom';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserManagement } from './parts/UserManagement';
import { DataMaintenance } from '@/components/DataMaintenance';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EmailTestCard } from '@/components/EmailTestCard';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Switch } from '@/components/ui/switch';
import { BellRing, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const Settings = () => {
  const { user, logout } = useAuth();
  const { isAdmin, loading } = useProfileRole();
  const navigate = useNavigate();

  const { isSubscribed, subscribeToPush, unsubscribeFromPush, loading: pushLoading } = usePushNotifications();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <Layout title="Configurações" subtitle="Carregando permissões..." showBackButton onBack={() => navigate(-1)}>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user && !loading) {
    return null;
  }

  return (
    <Layout title="Configurações" subtitle="Gerencie configurações administrativas" showBackButton onBack={() => navigate(-1)}>
      <div className="space-y-6">

        {/* Header Neo-Brutalista */}
        <div className="neo-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-500 dark:bg-violet-600 border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Configurações</h2>
              <p className="text-sm font-bold text-muted-foreground uppercase">Preferências do Usuário</p>
            </div>
          </div>
        </div>

        {/* 1. Preferências de Notificação - Disponível para todos */}
        <div className="neo-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]",
                isSubscribed ? "bg-green-500" : "bg-zinc-400"
              )}>
                {isSubscribed ? (
                  <BellRing className="h-6 w-6 text-white" />
                ) : (
                  <BellOff className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Notificações Push</h3>
                <p className="text-sm font-bold text-muted-foreground uppercase">
                  {isSubscribed ? "Você está inscrito para receber alertas" : "Ative para receber alertas no navegador"}
                </p>
              </div>
            </div>
            <Switch
              id="push-settings-toggle"
              checked={isSubscribed}
              onCheckedChange={(checked) => checked ? subscribeToPush() : unsubscribeFromPush()}
              disabled={pushLoading}
              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-zinc-200 dark:data-[state=unchecked]:bg-zinc-800"
            />
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500 border-2 border-black dark:border-white">
                <SettingsIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight">Painel Administrativo</h2>
            </div>

            <UserManagement />
            <DataMaintenance />
            <EmailTestCard />
          </div>
        )}

        {/* 4. Botão de Sair - Neo-Brutalista */}
        <div className="neo-card border-l-8 border-l-red-600 bg-red-50 dark:bg-red-950 p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-xl font-black uppercase tracking-tight text-red-700 dark:text-red-400">
              Sair do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Button
              onClick={handleLogout}
              className="w-full neo-btn bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wide h-12"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sair e Desconectar
            </Button>
          </CardContent>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;