import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Laptop, Users, GraduationCap, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard

interface RegistrationCardMenuProps {
  onNavigate: (view: 'chromebooks' | 'students' | 'teachers' | 'staff') => void;
  currentView: 'chromebooks' | 'students' | 'teachers' | 'staff';
}

const menuItems = [
  {
    title: 'Chromebooks',
    icon: Laptop,
    view: 'chromebooks',
    bgColor: 'bg-blue-500',
    color: 'text-white',
  },
  {
    title: 'Alunos',
    icon: Users,
    view: 'students',
    bgColor: 'bg-green-500',
    color: 'text-white',
  },
  {
    title: 'Professores',
    icon: GraduationCap,
    view: 'teachers',
    bgColor: 'bg-purple-500',
    color: 'text-white',
  },
  {
    title: 'Funcionários',
    icon: Briefcase,
    view: 'staff',
    bgColor: 'bg-orange-500',
    color: 'text-white',
  },
];

export function RegistrationCardMenu({ onNavigate, currentView }: RegistrationCardMenuProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.view === currentView;

        return (
          <div
            key={item.view}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] bg-white dark:bg-zinc-900 min-h-[140px]",
              isActive
                ? `border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]`
                : 'border-3 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]'
            )}
            onClick={() => onNavigate(item.view as any)}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full gap-3">
              <div className={cn(
                "p-4 border-3 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]",
                "transition-all duration-200",
                item.bgColor,
                isActive ? "scale-110 -translate-y-1" : "opacity-80 grayscale-[0.3]"
              )}>
                <Icon className={cn("h-7 w-7", item.color)} />
              </div>
              <CardTitle className="text-xs font-black uppercase tracking-wider text-black dark:text-white leading-tight">
                {item.title}
              </CardTitle>
            </CardContent>
          </div>
        );
      })}
    </div>
  );
}