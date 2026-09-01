import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import {
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  Download,
  Laptop,
  CheckCircle2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export const PWAInstallGuideModal: React.FC = () => {
  const {
    isGuideOpen,
    closeInstallGuide,
    isIOS,
    isAndroid,
    isInstalled,
    deferredPrompt,
    promptInstall
  } = usePWAInstall();

  const [activeTab, setActiveTab] = useState<string>('android');

  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios');
    } else if (isAndroid) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }
  }, [isIOS, isAndroid]);

  return (
    <Dialog open={isGuideOpen} onOpenChange={(open) => !open && closeInstallGuide()}>
      <DialogContent className="sm:max-w-md border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-950 p-6">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                Instalar Aplicativo Zelote
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground uppercase">
                Acesse mais rápido direto da sua tela inicial
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isInstalled ? (
          <div className="p-4 bg-green-500/10 border-2 border-green-500 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-700 dark:text-green-300">
                O Zelote já está instalado!
              </p>
              <p className="text-xs text-muted-foreground">
                Você pode abrir o aplicativo direto pelo ícone na tela inicial ou menu de apps.
              </p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-zinc-100 dark:bg-zinc-900 border-2 border-black dark:border-white p-1 rounded-none">
              <TabsTrigger
                value="android"
                className="font-bold text-xs uppercase data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-[2px_2px_0px_0px_#000] rounded-none transition-all"
              >
                <Smartphone className="h-3.5 w-3.5 mr-1" />
                Android
              </TabsTrigger>
              <TabsTrigger
                value="ios"
                className="font-bold text-xs uppercase data-[state=active]:bg-violet-500 data-[state=active]:text-white data-[state=active]:shadow-[2px_2px_0px_0px_#000] rounded-none transition-all"
              >
                <Smartphone className="h-3.5 w-3.5 mr-1" />
                iPhone / iPad
              </TabsTrigger>
              <TabsTrigger
                value="desktop"
                className="font-bold text-xs uppercase data-[state=active]:bg-zinc-700 data-[state=active]:text-white data-[state=active]:shadow-[2px_2px_0px_0px_#000] rounded-none transition-all"
              >
                <Laptop className="h-3.5 w-3.5 mr-1" />
                Computador
              </TabsTrigger>
            </TabsList>

            {/* TAB ANDROID */}
            <TabsContent value="android" className="space-y-4 pt-3">
              {deferredPrompt && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-500">
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-2">
                    Seu navegador suporta instalação direta:
                  </p>
                  <Button
                    onClick={() => promptInstall()}
                    className="w-full neo-btn bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wide h-9"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Instalar com 1 Clique
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-black uppercase text-zinc-600 dark:text-zinc-400">
                  Passo a passo no Chrome / Edge Android:
                </p>
                <ol className="space-y-2.5 text-xs">
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center h-6 w-6 font-black bg-black text-white dark:bg-white dark:text-black shrink-0 text-xs">
                      1
                    </span>
                    <span className="leading-tight pt-1">
                      Toque no menu de <strong>três pontos (⋮)</strong> no canto superior direito do navegador.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center h-6 w-6 font-black bg-black text-white dark:bg-white dark:text-black shrink-0 text-xs">
                      2
                    </span>
                    <span className="leading-tight pt-1">
                      Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center h-6 w-6 font-black bg-black text-white dark:bg-white dark:text-black shrink-0 text-xs">
                      3
                    </span>
                    <span className="leading-tight pt-1">
                      Confirme clicando em <strong>"Instalar"</strong>. Pronto! O ícone aparecerá no seu celular.
                    </span>
                  </li>
                </ol>
              </div>
            </TabsContent>

            {/* TAB IOS */}
            <TabsContent value="ios" className="space-y-4 pt-3">
              <div className="p-3 bg-violet-50 dark:bg-violet-950/40 border-2 border-violet-500">
                <p className="text-xs font-bold text-violet-900 dark:text-violet-300">
                  No Safari do iPhone/iPad, a Apple exige instalação manual pelo menu de compartilhamento.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black uppercase text-zinc-600 dark:text-zinc-400">
                  Passo a passo no Safari (iOS):
                </p>
                <ol className="space-y-2.5 text-xs">
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center h-6 w-6 font-black bg-black text-white dark:bg-white dark:text-black shrink-0 text-xs">
                      1
                    </span>
                    <span className="leading-tight pt-1">
                      No <strong>Safari</strong>, toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima <Share className="inline h-3.5 w-3.5 text-blue-500 mx-0.5" />) na barra inferior.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center h-6 w-6 font-black bg-black text-white dark:bg-white dark:text-black shrink-0 text-xs">
                      2
                    </span>
                    <span className="leading-tight pt-1">
                      Role o menu para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> (<PlusSquare className="inline h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300 mx-0.5" />).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center h-6 w-6 font-black bg-black text-white dark:bg-white dark:text-black shrink-0 text-xs">
                      3
                    </span>
                    <span className="leading-tight pt-1">
                      Toque em <strong>"Adicionar"</strong> no canto superior direito.
                    </span>
                  </li>
                </ol>
              </div>
            </TabsContent>

            {/* TAB DESKTOP */}
            <TabsContent value="desktop" className="space-y-4 pt-3">
              {deferredPrompt && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-500">
                  <Button
                    onClick={() => promptInstall()}
                    className="w-full neo-btn bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wide h-9"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Instalar no Computador
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-black uppercase text-zinc-600 dark:text-zinc-400">
                  No Chrome, Edge ou Brave no Computador:
                </p>
                <ol className="space-y-2.5 text-xs">
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center h-6 w-6 font-black bg-black text-white dark:bg-white dark:text-black shrink-0 text-xs">
                      1
                    </span>
                    <span className="leading-tight pt-1">
                      Procure pelo ícone de <strong>instalação (computador com seta para baixo)</strong> na barra de endereços (URL) do navegador.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center h-6 w-6 font-black bg-black text-white dark:bg-white dark:text-black shrink-0 text-xs">
                      2
                    </span>
                    <span className="leading-tight pt-1">
                      Ou clique no menu <strong>⋮ (Mais ferramentas)</strong> &rarr; <strong>"Instalar Zelote..."</strong>.
                    </span>
                  </li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="pt-2 flex justify-end">
          <Button
            variant="outline"
            onClick={closeInstallGuide}
            className="neo-btn font-bold uppercase text-xs h-9 px-4 border-2 border-black dark:border-white"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
