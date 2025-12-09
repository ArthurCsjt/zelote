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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
      bg: 'bg-neo-blue',
      iconBg: 'bg-white',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Devolução',
      subtitle: 'Registrar retornos',
      icon: RotateCcw,
      action: () => onNavigate('return'),
      bg: 'bg-neo-amber',
      iconBg: 'bg-white',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Agendamento',
      subtitle: 'Reservar horários',
      icon: Calendar,
      action: () => onNavigate('scheduling'),
      bg: 'bg-neo-violet',
      iconBg: 'bg-white',
      roles: ['admin', 'super_admin', 'professor', 'user'],
      badge: 'BETA'
    },
    {
      title: 'Inventário',
      subtitle: 'Ver dispositivos',
      icon: Laptop,
      action: () => onNavigate('inventory'),
      bg: 'bg-neo-teal',
      iconBg: 'bg-white',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Cadastros',
      subtitle: 'Novo registro',
      icon: PlusCircle,
      action: () => onNavigate('registration'),
      bg: 'bg-neo-green',
      iconBg: 'bg-white',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Contagem',
      subtitle: 'Auditoria física',
      icon: ListChecks,
      action: () => onNavigate('audit'),
      bg: 'bg-neo-rose',
      iconBg: 'bg-white',
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Dashboard',
      subtitle: 'Estatísticas',
      icon: BarChart3,
      action: () => onNavigate('dashboard'),
      bg: 'bg-neo-dark',
      iconBg: 'bg-white',
      textColor: 'text-white',
      roles: ['admin', 'super_admin', 'user']
    },
  ];

  const menuItemsFinal = allMenuItems.filter(item => item.roles.includes(role || 'user'));

  if (roleLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="neo-brutal-card p-8 animate-pulse">
          <Loader2 className="h-12 w-12 animate-spin text-black" />
        </div>
      </div>
    );
  }

  if (isProfessor && menuItemsFinal.length === 1 && menuItemsFinal[0].title === 'Agendamento') {
    return null;
  }

  return (
    <div className="relative py-8 px-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="neo-brutal-dots opacity-30" />
        <div className="absolute top-10 left-10 w-20 h-20 bg-neo-amber border-4 border-black rotate-12 hidden lg:block" />
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-neo-blue border-4 border-black -rotate-6 hidden lg:block" />
        <div className="absolute top-1/2 right-20 w-12 h-12 bg-neo-rose border-4 border-black rotate-45 hidden xl:block" />
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black dark:text-white mb-2">
          Menu Principal
        </h2>
        <div className="inline-block bg-neo-amber border-4 border-black px-4 py-1 shadow-neo-sm -rotate-1">
          <span className="font-bold text-sm uppercase tracking-wider">Sistema Zelote</span>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {menuItemsFinal.map((item, index) => {
          const Icon = item.icon;
          const isHovered = hoveredIndex === index;
          
          return (
            <div
              key={index}
              className={cn(
                "transition-all duration-500 ease-out",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              )}
              style={{ transitionDelay: `${index * 80}ms` }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <button
                onClick={item.action}
                className={cn(
                  "group relative w-full h-40 flex flex-col items-center justify-center gap-3 cursor-pointer",
                  "border-4 border-black dark:border-white",
                  "transition-all duration-200 ease-out",
                  "hover:-translate-x-1 hover:-translate-y-1",
                  "active:translate-x-0 active:translate-y-0",
                  item.bg,
                  item.textColor || 'text-black'
                )}
                style={{
                  boxShadow: isHovered 
                    ? '8px 8px 0px 0px #000' 
                    : '4px 4px 0px 0px #000',
                }}
              >
                {/* Badge */}
                {item.badge && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <span className="inline-block bg-neo-rose text-black border-3 border-black px-2 py-0.5 text-xs font-black uppercase shadow-neo-xs rotate-6">
                      {item.badge}
                    </span>
                  </div>
                )}

                {/* Icon container */}
                <div className={cn(
                  "relative p-4 border-4 border-black transition-all duration-300",
                  item.iconBg,
                  "shadow-neo-sm",
                  "group-hover:scale-110 group-hover:rotate-3"
                )}>
                  <Icon className="h-8 w-8 text-black stroke-[2.5]" />
                  
                  {/* Icon decorative corner */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-black" />
                </div>

                {/* Text content */}
                <div className="text-center px-2">
                  <h3 className={cn(
                    "font-black text-lg uppercase tracking-tight leading-tight",
                    item.textColor || 'text-black'
                  )}>
                    {item.title}
                  </h3>
                  <p className={cn(
                    "text-xs font-semibold uppercase tracking-wider opacity-80 mt-0.5",
                    item.textColor || 'text-black'
                  )}>
                    {item.subtitle}
                  </p>
                </div>

                {/* Bottom decorative bar */}
                <div 
                  className={cn(
                    "absolute bottom-0 left-0 w-full h-2 bg-black/20",
                    "transition-all duration-300",
                    isHovered && "h-3 bg-black/30"
                  )}
                />

                {/* Corner accent */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-black/30" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-black/30" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer decoration */}
      <div className="flex justify-center mt-10 gap-4">
        <div className="w-16 h-2 bg-black dark:bg-white" />
        <div className="w-8 h-2 bg-neo-blue border-2 border-black" />
        <div className="w-4 h-2 bg-neo-amber border-2 border-black" />
      </div>
    </div>
  );
}
