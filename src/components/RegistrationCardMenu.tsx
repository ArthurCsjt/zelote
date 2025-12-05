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
    color: 'text-green-600',
    activeBorder: 'border-green-400',
  },
  {
    title: 'Alunos',
    icon: Users,
    view: 'students',
    color: 'text-blue-600',
    activeBorder: 'border-blue-400',
  },
  {
    title: 'Professores',
    icon: GraduationCap,
    view: 'teachers',
    color: 'text-purple-600',
    activeBorder: 'border-purple-400',
  },
  {
    title: 'Funcionários',
    icon: Briefcase,
    view: 'staff',
    color: 'text-orange-600',
    activeBorder: 'border-orange-400',
  },
];

export function RegistrationCardMenu({ onNavigate, currentView }: RegistrationCardMenuProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.view === currentView;

        return (
          <div
            key={item.view}
            className={cn(
              "cursor-pointer transition-all duration-300 hover:translate-x-[-4px] hover:translate-y-[-4px] bg-white dark:bg-zinc-900",
              isActive
                ? `border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]`
                : 'border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]'
            )}
            onClick={() => onNavigate(item.view as any)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <div className={cn("p-3 border-2 border-black dark:border-white mb-3 bg-white dark:bg-black w-fit mx-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]")}>
                <Icon className={cn("h-6 w-6 text-black dark:text-white")} />
              </div>
              <CardTitle className="text-sm font-black uppercase tracking-tight text-black dark:text-white">
                {item.title}
              </CardTitle>
            </CardContent>
          </div>
        );
      })}
    </div>
  );
}