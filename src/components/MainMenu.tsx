import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardList, BarChart3, PlusCircle, Laptop, RotateCcw, ListChecks, Calendar, Loader2 } from 'lucide-react';
import { useProfileRole } from '@/hooks/use-profile-role';
import { cn } from '@/lib/utils';
// import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/badge'; // Importando Badge
import { LongDurationLoansPanel } from './LongDurationLoansPanel';

interface MainMenuProps {
  onNavigate: (route: 'registration' | 'dashboard' | 'loan' | 'inventory' | 'audit' | 'quick-register' | 'return' | 'scheduling', tab?: 'form' | 'active') => void;
}

export function MainMenu({
  onNavigate
}: MainMenuProps) {
  const { role, loading: roleLoading } = useProfileRole();
  const [isLoaded, setIsLoaded] = useState(false);

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
      icon: ClipboardList,
      action: () => onNavigate('loan', 'form'),
      color: 'text-menu-blue', // Azul (Mantido para referência, mas não usado no ícone)
      bg: 'bg-blue-300 dark:bg-blue-900/50',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Devolução',
      icon: RotateCcw,
      action: () => onNavigate('return'),
      color: 'text-menu-amber', // Âmbar
      bg: 'bg-amber-300 dark:bg-amber-900/50',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Agendamento',
      icon: Calendar,
      action: () => onNavigate('scheduling'),
      color: 'text-menu-violet', // Violeta
      bg: 'bg-violet-300 dark:bg-violet-900/50',
      roles: ['admin', 'super_admin', 'professor', 'user'],
      badge: { label: 'BETA', variant: 'info' }
    },
    {
      title: 'Inventário',
      icon: Laptop,
      action: () => onNavigate('inventory'),
      color: 'text-menu-teal', // Teal
      bg: 'bg-teal-300 dark:bg-teal-900/50',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Cadastros',
      icon: PlusCircle,
      action: () => onNavigate('registration'),
      color: 'text-menu-green', // Verde
      bg: 'bg-green-300 dark:bg-green-900/50',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Contagem',
      icon: ListChecks,
      action: () => onNavigate('audit'),
      color: 'text-menu-rose', // Rosa/Vermelho
      bg: 'bg-rose-300 dark:bg-rose-900/50',
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Dashboard',
      icon: BarChart3,
      action: () => onNavigate('dashboard'),
      color: 'text-menu-dark-blue', // Azul Escuro
      bg: 'bg-blue-500 dark:bg-blue-900/50',
      roles: ['admin', 'super_admin', 'user']
    },
  ];

  const menuItemsFinal = allMenuItems.filter(item => item.roles.includes(role || 'user'));

  if (roleLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isProfessor && menuItemsFinal.length === 1 && menuItemsFinal[0].title === 'Agendamento') {
    return null;
  }

  return (
    <div className="space-y-8 relative py-8 animate-fade-in min-h-[calc(100vh-100px)]">
      {/* Background glow effect - PRESERVED */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-blue-500/5 to-transparent rounded-3xl blur-3xl" />

      {/* Floating Geometric Shapes (Added for "professional touch") */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary rotate-12 neo-brutal-shadow animate-float -z-10 opacity-50" />
      <div className="absolute bottom-32 right-16 w-16 h-16 bg-warning rotate-45 neo-brutal-shadow animate-float-delayed -z-10 opacity-50" />
      <div className="absolute top-1/3 right-20 w-12 h-12 bg-success rotate-6 neo-brutal-shadow animate-float -z-10 opacity-50" />
      <div className="absolute bottom-20 left-24 w-14 h-14 bg-error -rotate-12 neo-brutal-shadow animate-float-delayed -z-10 opacity-50" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto relative z-10">
        {menuItemsFinal.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={cn(
                "transition-all duration-500 ease-out",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div
                className="group h-32 w-full flex flex-col items-center justify-center gap-3 cursor-pointer bg-white dark:bg-zinc-900 border-[3px] border-black dark:border-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                onClick={item.action}
              >
                <div className={cn(
                  "p-2.5 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform duration-200 group-hover:scale-105",
                  item.bg
                )}>
                  <Icon className="h-6 w-6 text-black dark:text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-black dark:text-white uppercase tracking-tight">
                    {item.title}
                  </span>
                  {item.badge && (
                    <Badge
                      variant={item.badge.variant as any}
                      className="text-[10px] h-4 px-1.5 py-0.5 border border-black bg-yellow-300 text-black rounded-none shadow-[1px_1px_0px_0px_#000]"
                    >
                      {item.badge.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Painel de Alertas de Longa Duração */}
      <LongDurationLoansPanel />
    </div>
  );
}