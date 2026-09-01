import { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useNavigate } from 'react-router-dom';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserManagement } from './parts/UserManagement';
import { DataMaintenance } from '@/components/DataMaintenance';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, Settings as SettingsIcon, Download, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EmailTestCard } from '@/components/EmailTestCard';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { Switch } from '@/components/ui/switch';
import { BellRing, BellOff, RefreshCw, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Settings = () => {
  const { user, logout } = useAuth();
  const { isAdmin, loading } = useProfileRole();
  const navigate = useNavigate();

  const { isSubscribed, subscribeToPush, unsubscribeFromPush, loading: pushLoading } = usePushNotifications();
  const { isInstalled, isInstallable, isIOS, isAndroid, promptInstall, openInstallGuide } = usePWAInstall();
  const { toast } = useToast();

  const checkForUpdates = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        toast({
          title: "Buscando atualizações...",
          description: "Verificando se há uma nova versão disponível.",
        });

        await registration.update();

        setTimeout(() => {
          toast({
            title: "Sistema Atualizado",
            description: "Você já está utilizando a versão mais recente do Zelote.",
          });
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao verificar atualização:', error);
      toast({
        title: "Erro ao verificar",
        description: "Não foi possível buscar atualizações agora.",
        variant: "destructive"
      });
    }
  };

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

        {/* 2. Aplicativo Zelote & Instalação (PWA) */}
        <div className="neo-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-3">
              <div className="p-3 bg-blue-500 border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] shrink-0">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-xl font-black uppercase tracking-tight">Aplicativo Zelote</h3>
                  {isInstalled ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2 py-0.5 bg-green-500 text-white border border-black shadow-[2px_2px_0px_0px_#000]">
                      <CheckCircle2 className="h-3 w-3" /> Instalado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2 py-0.5 bg-amber-400 text-black border border-black shadow-[2px_2px_0px_0px_#000]">
                      {isIOS ? '📱 iOS / Safari' : isAndroid ? '📱 Android' : '💻 Navegador Web'}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-muted-foreground uppercase">
                  {isInstalled
                    ? "Rodando em modo aplicativo nativo no dispositivo"
                    : "Instale no celular para acesso rápido pela tela inicial e notificações"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 items-center">
              {!isInstalled ? (
                <Button
                  onClick={() => promptInstall()}
                  className="neo-btn bg-green-500 hover:bg-green-600 text-white font-bold uppercase tracking-wide h-10 px-5 shadow-[3px_3px_0px_0px_#000]"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar / Instalar App
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={openInstallGuide}
                  className="neo-btn bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-white font-bold uppercase tracking-wide h-10 px-4"
                >
                  <HelpCircle className="h-4 w-4 mr-1.5" />
                  Instruções
                </Button>
              )}

              <Button
                variant="outline"
                onClick={checkForUpdates}
                className="neo-btn bg-white dark:bg-zinc-900 border-2 border-black dark:border-white font-bold uppercase tracking-wide h-10 px-4 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Atualizações
              </Button>
            </div>
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