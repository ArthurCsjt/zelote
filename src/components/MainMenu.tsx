import React, { useEffect, useState } from 'react';
import { ClipboardList, BarChart3, PlusCircle, Laptop, RotateCcw, ListChecks, Calendar, Loader2 } from 'lucide-react';
import { useProfileRole } from '@/hooks/use-profile-role';
import { cn } from '@/lib/utils';

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
      subtitle: 'Gerenciar saídas',
      icon: ClipboardList,
      action: () => onNavigate('loan', 'form'),
      accent: 'bg-blue-500',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Devolução',
      subtitle: 'Registrar retornos',
      icon: RotateCcw,
      action: () => onNavigate('return'),
      accent: 'bg-amber-500',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Agendamento',
      subtitle: 'Reservar horários',
      icon: Calendar,
      action: () => onNavigate('scheduling'),
      accent: 'bg-violet-500',
      roles: ['admin', 'super_admin', 'professor', 'user'],
      badge: 'BETA'
    },
    {
      title: 'Inventário',
      subtitle: 'Ver dispositivos',
      icon: Laptop,
      action: () => onNavigate('inventory'),
      accent: 'bg-teal-500',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Cadastros',
      subtitle: 'Novo registro',
      icon: PlusCircle,
      action: () => onNavigate('registration'),
      accent: 'bg-green-500',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Contagem',
      subtitle: 'Auditoria física',
      icon: ListChecks,
      action: () => onNavigate('audit'),
      accent: 'bg-rose-500',
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Dashboard',
      subtitle: 'Estatísticas',
      icon: BarChart3,
      action: () => onNavigate('dashboard'),
      accent: 'bg-slate-700',
      roles: ['admin', 'super_admin', 'user']
    },
  ];

  const menuItemsFinal = allMenuItems.filter(item => item.roles.includes(role || 'user'));

  if (roleLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isProfessor && menuItemsFinal.length === 1 && menuItemsFinal[0].title === 'Agendamento') {
    return null;
  }

  return (
    <div className="relative py-6 px-4">
      {/* Animated background - same as login */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="neo-brutal-grid animate-float opacity-20" />
        <div className="neo-brutal-dots animate-float-delayed opacity-15" />
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
          Menu Principal
        </h2>
        <p className="text-sm text-muted-foreground">Sistema Zelote</p>
      </div>

      {/* Menu Grid - Compact cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {menuItemsFinal.map((item, index) => {
          const Icon = item.icon;
          
          return (
            <div
              key={index}
              className={cn(
                "transition-all duration-500 ease-out",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <button
                onClick={item.action}
                className={cn(
                  "group relative w-full p-4 flex flex-col items-center justify-center gap-2 cursor-pointer",
                  "bg-card border-2 border-border rounded-lg",
                  "transition-all duration-200 ease-out",
                  "hover:border-foreground hover:-translate-y-1 hover:shadow-lg",
                  "active:translate-y-0 active:shadow-md"
                )}
              >
                {/* Badge */}
                {item.badge && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="inline-block bg-primary text-primary-foreground px-1.5 py-0.5 text-[10px] font-bold uppercase rounded">
                      {item.badge}
                    </span>
                  </div>
                )}

                {/* Icon with accent */}
                <div className={cn(
                  "p-2.5 rounded-lg transition-transform duration-200",
                  item.accent,
                  "group-hover:scale-110"
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>

                {/* Text */}
                <div className="text-center">
                  <h3 className="font-semibold text-sm text-foreground leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
