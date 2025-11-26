import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, BarChart3, PlusCircle, Laptop, RotateCcw, Brain, ListChecks, QrCode, Calendar, Loader2 } from 'lucide-react';
import { useProfileRole } from '@/hooks/use-profile-role';
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard
import { cn } from '@/lib/utils';

interface MainMenuProps {
  onNavigate: (route: 'registration' | 'dashboard' | 'loan' | 'inventory' | 'audit' | 'quick-register' | 'return' | 'scheduling', tab?: 'form' | 'active') => void;
}

// Definição dos estilos dos cards
const CARD_STYLES = {
  'Empréstimos': { icon: ClipboardList, color: 'text-blue-500', hover: 'hover:border-blue-500/50' },
  'Devolução': { icon: RotateCcw, color: 'text-yellow-500', hover: 'hover:border-yellow-500/50' },
  'Agendamento': { icon: Calendar, color: 'text-blue-400', hover: 'hover:border-blue-400/50' },
  'Inventário': { icon: Laptop, color: 'text-teal-400', hover: 'hover:border-teal-400/50' },
  'Cadastros': { icon: PlusCircle, color: 'text-green-500', hover: 'hover:border-green-500/50' },
  'Contagem': { icon: ListChecks, color: 'text-rose-500', hover: 'hover:border-rose-500/50' },
  'Dashboard': { icon: BarChart3, color: 'text-purple-500', hover: 'hover:border-purple-500/50' },
};

export function MainMenu({
  onNavigate
}: MainMenuProps) {
  const { role, loading: roleLoading } = useProfileRole();
  const [isLoaded, setIsLoaded] = useState(false);
  
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isProfessor = role === 'professor';

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const allMenuItems = [
    {
      title: 'Empréstimos',
      action: () => onNavigate('loan', 'form'),
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Devolução',
      action: () => onNavigate('return'), 
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Agendamento',
      action: () => onNavigate('scheduling'), 
      roles: ['admin', 'super_admin', 'professor']
    },
    {
      title: 'Inventário',
      action: () => onNavigate('inventory'),
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Cadastros',
      action: () => onNavigate('registration'),
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Contagem',
      action: () => onNavigate('audit'),
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Dashboard',
      action: () => onNavigate('dashboard'),
      roles: ['admin', 'super_admin']
    },
  ];
  
  const menuItemsFinal = allMenuItems.filter(item => item.roles.includes(role || 'user'));

  const getFadeInStyle = (index: number) => {
    if (!isLoaded) return {
      opacity: 0,
      transform: 'translateY(20px)'
    };
    return {
      opacity: 1,
      transform: 'translateY(0)',
      transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 100}ms`
    };
  };
  
  if (roleLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }
  
  // Se for professor, ele será redirecionado pelo Index.tsx
  if (isProfessor && menuItemsFinal.length === 1 && menuItemsFinal[0].title === 'Agendamento') {
      return null;
  }

  return (
    <div className="space-y-8 relative py-[30px]">
      {/* Removendo o fundo animado e orbes, confiando no fundo escuro do body/layout */}
      
      {/* Grid 3x3 (ou 5 colunas em telas grandes) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto relative z-10">
        {menuItemsFinal.map((item, index) => {
          const style = CARD_STYLES[item.title as keyof typeof CARD_STYLES];
          const Icon = style.icon;
          
          return (
            <div key={index} style={getFadeInStyle(index)} className="group">
              <GlassCard
                onClick={item.action}
                // Estilo Dark Mode: Fundo escuro, borda sutil, hover de borda colorida
                className={cn(
                  "w-full h-32 sm:h-40 flex flex-col items-center justify-center text-center cursor-pointer",
                  "bg-card dark:bg-zinc-900/80 dark:border-zinc-800/50 border-border",
                  "shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]",
                  "dark:hover:bg-zinc-800/90",
                  // Adicionando borda colorida no hover
                  `hover:border-2 ${style.hover} dark:border-zinc-800/50`
                )}
              >
                <div className={cn("p-3 rounded-full mb-2", style.color)}>
                  <Icon className="h-7 w-7" />
                </div>
                <span className="text-sm font-semibold text-foreground dark:text-white">
                  {item.title}
                </span>
              </GlassCard>
            </div>
          );
        })}
      </div>
    </div>
  );
}