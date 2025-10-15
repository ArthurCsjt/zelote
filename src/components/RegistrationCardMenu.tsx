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
    bgColor: 'bg-green-50',
  },
  {
    title: 'Alunos',
    icon: Users,
    view: 'students',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Professores',
    icon: GraduationCap,
    view: 'teachers',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Funcionários',
    icon: Briefcase,
    view: 'staff',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
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
              "cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02]", // Removido 'glass-card' e 'hover:shadow-xl' duplicados
              item.bgColor,
              isActive ? `border-2 ${item.color.replace('text-', 'border-')}` : 'border-gray-200'
            )}
            onClick={() => onNavigate(item.view as any)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Icon className={cn("h-6 w-6 mb-1", item.color)} />
              <CardTitle className="text-sm font-semibold text-gray-800">
                {item.title}
              </CardTitle>
            </CardContent>
          </GlassCard>
        );
      })}
    </div>
  );
}