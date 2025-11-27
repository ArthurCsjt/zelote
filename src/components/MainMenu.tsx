import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardList, BarChart3, PlusCircle, Laptop, RotateCcw, ListChecks, Calendar, Loader2 } from 'lucide-react';
import { useProfileRole } from '@/hooks/use-profile-role';
import { cn } from '@/lib/utils';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/badge'; // Importando Badge

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
      color: 'text-blue-600 dark:text-blue-400',
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Devolução',
      icon: RotateCcw,
      action: () => onNavigate('return'),
      color: 'text-amber-600 dark:text-amber-400',
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Agendamento',
      icon: Calendar,
      action: () => onNavigate('scheduling'),
      color: 'text-blue-600 dark:text-blue-400',
      roles: ['admin', 'super_admin', 'professor'],
      badge: { label: 'BETA', variant: 'info' } // NOVO: Badge de aviso
    },
    {
      title: 'Inventário',
      icon: Laptop,
      action: () => onNavigate('inventory'),
      color: 'text-cyan-600 dark:text-cyan-400',
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Cadastros',
      icon: PlusCircle,
      action: () => onNavigate('registration'),
      color: 'text-emerald-600 dark:text-emerald-400',
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Contagem',
      icon: ListChecks,
      action: () => onNavigate('audit'),
      color: 'text-rose-600 dark:text-rose-400',
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Dashboard',
      icon: BarChart3,
      action: () => onNavigate('dashboard'),
      color: 'text-indigo-600 dark:text-indigo-400',
      roles: ['admin', 'super_admin']
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
    <div className="space-y-8 relative py-8 animate-fade-in">
      {/* Background glow effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-500/5 to-transparent rounded-3xl blur-3xl" />

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
              <GlassCard
                className="group h-32 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-zinc-200/50 dark:border-zinc-800/50"
                onClick={item.action}
              >
                <div className={cn(
                  "p-3 rounded-full bg-zinc-50 dark:bg-zinc-800 group-hover:scale-110 transition-transform duration-300",
                  // Removida a sombra extra do ícone
                )}>
                  <Icon className={cn("h-6 w-6", item.color)} />
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                      {item.title}
                    </span>
                    {item.badge && (
                        <Badge 
                            variant={item.badge.variant as any} 
                            className="text-[10px] h-4 px-1.5 py-0.5 bg-info-bg text-info-foreground dark:bg-info-bg/50 dark:text-info-foreground"
                        >
                            {item.badge.label}
                        </Badge>
                    )}
                </div>
              </GlassCard>
            </div>
          );
        })}
      </div>
    </div>
  );
}