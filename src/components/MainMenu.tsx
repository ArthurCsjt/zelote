import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardList, BarChart3, PlusCircle, Laptop, RotateCcw, ListChecks, Calendar, Loader2 } from 'lucide-react';
import { useProfileRole } from '@/hooks/use-profile-role';
import { cn } from '@/lib/utils';
// import { GlassCard } from './ui/GlassCard';
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
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Devolução',
      icon: RotateCcw,
      action: () => onNavigate('return'),
      color: 'text-amber-600 dark:text-amber-400',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Agendamento',
      icon: Calendar,
      action: () => onNavigate('scheduling'),
      color: 'text-blue-600 dark:text-blue-400',
      roles: ['admin', 'super_admin', 'professor', 'user'],
      badge: { label: 'BETA', variant: 'info' }
    },
    {
      title: 'Inventário',
      icon: Laptop,
      action: () => onNavigate('inventory'),
      color: 'text-cyan-600 dark:text-cyan-400',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Cadastros',
      icon: PlusCircle,
      action: () => onNavigate('registration'),
      color: 'text-emerald-600 dark:text-emerald-400',
      roles: ['admin', 'super_admin', 'user']
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
              <div
                className="group h-28 flex flex-col items-center justify-center gap-2 cursor-pointer neo-card hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_#000] transition-all duration-200"
                onClick={item.action}
              >
                <div className={cn(
                  "p-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-800 transition-transform duration-300 shadow-[2px_2px_0px_0px_#000] group-hover:scale-110",
                )}>
                  <Icon className={cn("h-5 w-5 text-black dark:text-white")} />
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
    </div>
  );
}