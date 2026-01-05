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
    <div className="relative py-6 md:py-10 animate-fade-in min-h-[calc(100vh-120px)]">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 -z-20 opacity-[0.02] dark:opacity-[0.03]" 
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 20px,
            currentColor 20px,
            currentColor 21px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 20px,
            currentColor 21px,
            currentColor 21px
          )`
        }}
      />

      {/* Menu Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto px-4 relative z-10">
        {menuItemsFinal.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={cn(
                "transition-all duration-500 ease-out",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <button
                className="neo-menu-card group"
                onClick={item.action}
              >
                {/* Icon Container */}
                <div className={cn(
                  "neo-menu-icon-wrapper",
                  item.bg
                )}>
                  <Icon className="h-5 w-5 md:h-6 md:w-6 text-black dark:text-white transition-transform duration-200 group-hover:scale-110" />
                </div>
                
                {/* Title & Badge */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="font-bold text-xs md:text-sm text-foreground uppercase tracking-wide">
                    {item.title}
                  </span>
                  {item.badge && (
                    <Badge
                      variant={item.badge.variant as any}
                      className="neo-badge-beta"
                    >
                      {item.badge.label}
                    </Badge>
                  )}
                </div>

                {/* Hover indicator line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}