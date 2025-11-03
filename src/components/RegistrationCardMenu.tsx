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
          <GlassCard
            key={item.view}
            className={cn(
              "cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] bg-white/80",
              isActive ? `border-2 ${item.activeBorder} shadow-lg` : 'border-gray-200'
            )}
            onClick={() => onNavigate(item.view as any)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Icon className={cn("h-6 w-6 mb-1", item.color)} />
              {/* CORREÇÃO: Adicionando dark:text-foreground para garantir que o texto seja claro no Dark Mode */}
              <CardTitle className="text-sm font-semibold text-gray-800 dark:text-foreground">
                {item.title}
              </CardTitle>
            </CardContent>
          </GlassCard>
        );
      })}
    </div>
  );
}