import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useNavigate } from 'react-router-dom';
import { UserManagement } from './parts/UserManagement';
import { DataMaintenance } from '@/components/DataMaintenance';
import { EmailTestCard } from '@/components/EmailTestCard';
import { UserProfileCard } from '@/components/settings/UserProfileCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import {
  soundEffects,
  isAudioMuted,
  setAudioMuted,
  isVibrationMuted,
  setVibrationMuted,
} from '@/utils/audioFeedback';
import {
  LogOut,
  Loader2,
  Settings as SettingsIcon,
  Download,
  HelpCircle,
  CheckCircle2,
  BellRing,
  BellOff,
  RefreshCw,
  Smartphone,
  User,
  Sliders,
  Users,
  Database,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Vibrate,
  Shield,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Settings = () => {
  const { user, logout } = useAuth();
  const { isAdmin, loading } = useProfileRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // Web Push & PWA
  const { isSubscribed, subscribeToPush, unsubscribeFromPush, loading: pushLoading } = usePushNotifications();
  const { isInstalled, isIOS, isAndroid, promptInstall, openInstallGuide } = usePWAInstall();

  // Audio & Vibration Settings State
  const [audioMuted, setAudioMutedState] = useState<boolean>(() => isAudioMuted());
  const [vibrationMuted, setVibrationMutedState] = useState<boolean>(() => isVibrationMuted());

  // Active Tab State
  const [activeTab, setActiveTab] = useState('account');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleAudioToggle = (checked: boolean) => {
    // checked = sound ON (unmuted)
    const muted = !checked;
    setAudioMuted(muted);
    setAudioMutedState(muted);
    if (checked) {
      soundEffects.playSuccessBeep();
      toast({
        title: "Bipes Sonoros Ativados",
        description: "O sistema emitirá bipes na leitura e confirmação.",
      });
    } else {
      toast({
        title: "Bipes Sonoros Silenciados",
        description: "Os sons de feedback foram desativados.",
      });
    }
  };

  const handleVibrationToggle = (checked: boolean) => {
    // checked = vibration ON (unmuted)
    const muted = !checked;
    setVibrationMuted(muted);
    setVibrationMutedState(muted);
    if (checked) {
      soundEffects.vibrate(100);
      toast({
        title: "Vibração Háptica Ativada",
        description: "O dispositivo vibrará ao escanear códigos e confirmar ações.",
      });
    } else {
      toast({
        title: "Vibração Háptica Desativada",
        description: "O feedback tátil foi silenciado.",
      });
    }
  };

  const checkForUpdates = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        toast({
          title: "Buscando atualizações...",
          description: "Verificando se há uma nova versão disponível no servidor.",
        });

        await registration.update();

        setTimeout(() => {
          toast({
            title: "Sistema Atualizado",
            description: "Você já está utilizando a versão mais recente do Zelote.",
          });
        }, 2000);
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

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <Layout title="Configurações" subtitle="Carregando preferências..." showBackButton onBack={() => navigate(-1)}>
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
    <Layout title="Configurações" subtitle="Gerencie sua conta e preferências do sistema" showBackButton onBack={() => navigate(-1)}>
      <div className="space-y-6">

        {/* 1. Header Neo-Brutalista Principal */}
        <div className="neo-card p-6 bg-white dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-violet-600 border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]">
                <SettingsIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                  Configurações
                </h2>
                <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase">
                  Central de Preferências & Administração
                </p>
              </div>
            </div>

            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 border-2 border-black dark:border-white text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]">
                <Shield className="h-3.5 w-3.5" />
                Painel Administrativo Ativo
              </span>
            )}
          </div>
        </div>

        {/* 2. Sistema de Abas Neo-Brutalistas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className={cn(
            "grid w-full h-auto p-1.5 bg-zinc-100 dark:bg-zinc-800/80 border-3 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] gap-1.5",
            isAdmin ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2"
          )}>
            <TabsTrigger
              value="account"
              className="font-black uppercase text-xs tracking-wider py-3 border-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-foreground data-[state=active]:shadow-[2px_2px_0px_0px_#000] dark:data-[state=active]:shadow-[2px_2px_0px_0px_#fff] flex items-center justify-center gap-2"
            >
              <User className="h-4 w-4 text-blue-600" />
              <span>Minha Conta</span>
            </TabsTrigger>

            <TabsTrigger
              value="preferences"
              className="font-black uppercase text-xs tracking-wider py-3 border-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-foreground data-[state=active]:shadow-[2px_2px_0px_0px_#000] dark:data-[state=active]:shadow-[2px_2px_0px_0px_#fff] flex items-center justify-center gap-2"
            >
              <Sliders className="h-4 w-4 text-emerald-600" />
              <span>Preferências</span>
            </TabsTrigger>

            {isAdmin && (
              <>
                <TabsTrigger
                  value="users"
                  className="font-black uppercase text-xs tracking-wider py-3 border-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-foreground data-[state=active]:shadow-[2px_2px_0px_0px_#000] dark:data-[state=active]:shadow-[2px_2px_0px_0px_#fff] flex items-center justify-center gap-2"
                >
                  <Users className="h-4 w-4 text-violet-600" />
                  <span>Usuários & Exceções</span>
                </TabsTrigger>

                <TabsTrigger
                  value="maintenance"
                  className="font-black uppercase text-xs tracking-wider py-3 border-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-foreground data-[state=active]:shadow-[2px_2px_0px_0px_#000] dark:data-[state=active]:shadow-[2px_2px_0px_0px_#fff] flex items-center justify-center gap-2"
                >
                  <Database className="h-4 w-4 text-amber-500" />
                  <span>Manutenção</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* ========================================================================= */}
          {/* ABA 1: MINHA CONTA & SEGURANÇA */}
          {/* ========================================================================= */}
          <TabsContent value="account" className="space-y-6 animate-in fade-in duration-200">
            <UserProfileCard />

            {/* Card de Logout Neo-Brutalista */}
            <div className="neo-card p-6 bg-red-50 dark:bg-red-950/40 border-l-8 border-l-red-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-black uppercase tracking-tight text-red-700 dark:text-red-400">
                  Encerrar Sessão no Dispositivo
                </h4>
                <p className="text-xs font-bold text-muted-foreground uppercase mt-0.5">
                  Desconecte sua conta com segurança ao terminar seu turno de trabalho
                </p>
              </div>

              <Button
                onClick={handleLogout}
                className="neo-btn bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider h-11 px-6 shadow-[3px_3px_0px_0px_#000] shrink-0"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair do Sistema
              </Button>
            </div>
          </TabsContent>

          {/* ========================================================================= */}
          {/* ABA 2: PREFERÊNCIAS & INTERFACE */}
          {/* ========================================================================= */}
          <TabsContent value="preferences" className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* 2.1 Tema / Aparência */}
              <div className="neo-card p-6 bg-white dark:bg-zinc-900 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 pb-4 border-b-2 border-black/10 dark:border-white/10 mb-4">
                    <div className="p-2.5 bg-amber-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                      <Sun className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tight">Tema & Aparência</h4>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Escolha o modo de contraste do sistema</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={cn(
                        "p-4 border-2 font-black uppercase text-xs flex flex-col items-center gap-2 transition-all",
                        theme === 'light'
                          ? "bg-amber-100 dark:bg-amber-950/50 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] text-black dark:text-white"
                          : "bg-zinc-50 dark:bg-zinc-800 border-black/20 hover:border-black text-muted-foreground"
                      )}
                    >
                      <Sun className={cn("h-6 w-6", theme === 'light' ? "text-amber-500" : "text-zinc-400")} />
                      <span>Modo Claro</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={cn(
                        "p-4 border-2 font-black uppercase text-xs flex flex-col items-center gap-2 transition-all",
                        theme === 'dark'
                          ? "bg-violet-100 dark:bg-violet-950/50 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] text-black dark:text-white"
                          : "bg-zinc-50 dark:bg-zinc-800 border-black/20 hover:border-black text-muted-foreground"
                      )}
                    >
                      <Moon className={cn("h-6 w-6", theme === 'dark' ? "text-violet-500" : "text-zinc-400")} />
                      <span>Modo Escuro</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] font-bold text-muted-foreground mt-4">
                  O modo escuro reduz o cansaço visual em turnos noturnos e economiza bateria em telas OLED.
                </p>
              </div>

              {/* 2.2 Feedback Sensorial (Áudio & Vibração) */}
              <div className="neo-card p-6 bg-white dark:bg-zinc-900 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 pb-4 border-b-2 border-black/10 dark:border-white/10 mb-4">
                    <div className="p-2.5 bg-emerald-500 text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]">
                      <Volume2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tight">Feedback Sensorial</h4>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Sons do leitor de código e vibração tátil</p>
                    </div>
                  </div>

                  <div className="space-y-4 mt-2">
                    {/* Toggle Áudio */}
                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/60 border-2 border-black/20 dark:border-white/20">
                      <div className="flex items-center gap-3">
                        {!audioMuted ? (
                          <Volume2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <VolumeX className="h-5 w-5 text-zinc-400" />
                        )}
                        <div>
                          <p className="text-xs font-black uppercase text-foreground">Bipes de Leitura / Sucesso</p>
                          <p className="text-[11px] font-bold text-muted-foreground">
                            {!audioMuted ? "Som habilitado ao ler códigos" : "Mudo (silencioso para salas/bibliotecas)"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!audioMuted && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => soundEffects.playSuccessBeep()}
                            className="h-7 text-[10px] font-black uppercase border border-black dark:border-white px-2"
                          >
                            Ouvir
                          </Button>
                        )}
                        <Switch
                          checked={!audioMuted}
                          onCheckedChange={handleAudioToggle}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Toggle Vibração */}
                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/60 border-2 border-black/20 dark:border-white/20">
                      <div className="flex items-center gap-3">
                        <Vibrate className={cn("h-5 w-5", !vibrationMuted ? "text-emerald-600" : "text-zinc-400")} />
                        <div>
                          <p className="text-xs font-black uppercase text-foreground">Vibração Háptica no Celular</p>
                          <p className="text-[11px] font-bold text-muted-foreground">
                            {!vibrationMuted ? "Vibra ao confirmar empréstimo" : "Vibração desativada"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!vibrationMuted && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => soundEffects.vibrate(100)}
                            className="h-7 text-[10px] font-black uppercase border border-black dark:border-white px-2"
                          >
                            Testar
                          </Button>
                        )}
                        <Switch
                          checked={!vibrationMuted}
                          onCheckedChange={handleVibrationToggle}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] font-bold text-muted-foreground mt-4">
                  As preferências sensoriais são salvas exclusivamente no seu dispositivo atual.
                </p>
              </div>

              {/* 2.3 Notificações Push */}
              <div className="neo-card p-6 bg-white dark:bg-zinc-900 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 pb-4 border-b-2 border-black/10 dark:border-white/10 mb-4">
                    <div className={cn(
                      "p-2.5 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]",
                      isSubscribed ? "bg-green-500 text-white" : "bg-zinc-400 text-white"
                    )}>
                      {isSubscribed ? <BellRing className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black uppercase tracking-tight">Notificações Push</h4>
                        <span className={cn(
                          "px-2 py-0.5 text-[10px] font-black uppercase border border-black shadow-[1px_1px_0px_0px_#000]",
                          isSubscribed ? "bg-green-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-muted-foreground"
                        )}>
                          {isSubscribed ? 'Ativo' : 'Desativado'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Alertas no navegador e no celular</p>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-muted-foreground uppercase mb-4">
                    Receba avisos instantâneos sobre empréstimos em atraso, contagens e avisos urgentes mesmo com a tela fechada.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t-2 border-black/10 dark:border-white/10">
                  <span className="text-xs font-black uppercase">
                    {isSubscribed ? "Notificações Ativadas" : "Ativar Alertas"}
                  </span>
                  <Switch
                    checked={isSubscribed}
                    onCheckedChange={(checked) => checked ? subscribeToPush() : unsubscribeFromPush()}
                    disabled={pushLoading}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>

              {/* 2.4 Aplicativo Zelote (PWA) */}
              <div className="neo-card p-6 bg-white dark:bg-zinc-900 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 pb-4 border-b-2 border-black/10 dark:border-white/10 mb-4">
                    <div className="p-2.5 bg-blue-500 text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black uppercase tracking-tight">Aplicativo Zelote</h4>
                        {isInstalled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 bg-green-500 text-white border border-black shadow-[1px_1px_0px_0px_#000]">
                            <CheckCircle2 className="h-3 w-3" /> Instalado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 bg-amber-400 text-black border border-black shadow-[1px_1px_0px_0px_#000]">
                            {isIOS ? '📱 iOS' : isAndroid ? '📱 Android' : '💻 Navegador'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">
                        {isInstalled ? "Modo nativo ativado" : "Instalação rápida na tela inicial"}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-muted-foreground uppercase mb-4">
                    Instale como aplicativo para acesso instantâneo aos formulários, leitor de código de barras e modo offline.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t-2 border-black/10 dark:border-white/10">
                  {!isInstalled ? (
                    <Button
                      onClick={() => promptInstall()}
                      className="neo-btn bg-green-500 hover:bg-green-600 text-white font-black uppercase text-xs h-10 px-4 shadow-[2px_2px_0px_0px_#000] flex-1"
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      Instalar App
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={openInstallGuide}
                      className="neo-btn font-bold uppercase text-xs h-10 px-3 border-2 border-black dark:border-white"
                    >
                      <HelpCircle className="h-4 w-4 mr-1.5" />
                      Guia
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={checkForUpdates}
                    className="neo-btn font-bold uppercase text-xs h-10 px-3 border-2 border-black dark:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Buscar Atualização
                  </Button>
                </div>
              </div>

            </div>
          </TabsContent>

          {/* ========================================================================= */}
          {/* ABA 3: GESTÃO DE ACESSO & EXCEÇÕES (ADMIN) */}
          {/* ========================================================================= */}
          {isAdmin && (
            <TabsContent value="users" className="space-y-6 animate-in fade-in duration-200">
              <UserManagement />
            </TabsContent>
          )}

          {/* ========================================================================= */}
          {/* ABA 4: DADOS & MANUTENÇÃO (ADMIN) */}
          {/* ========================================================================= */}
          {isAdmin && (
            <TabsContent value="maintenance" className="space-y-6 animate-in fade-in duration-200">
              <DataMaintenance />
              <EmailTestCard />
            </TabsContent>
          )}

        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;