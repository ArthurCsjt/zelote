import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Laptop, Users, GraduationCap, Briefcase, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegistrationMenuProps {
  onNavigate: (view: 'chromebooks' | 'students' | 'teachers' | 'staff') => void;
}

const menuItems = [
  {
    title: 'Chromebooks',
    description: 'Adicionar novos equipamentos ao inventário.',
    icon: Laptop,
    view: 'chromebooks',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Alunos',
    description: 'Cadastrar alunos individualmente ou via CSV.',
    icon: Users,
    view: 'students',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Professores',
    description: 'Cadastrar professores para empréstimos.',
    icon: GraduationCap,
    view: 'teachers',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Funcionários',
    description: 'Cadastrar funcionários para empréstimos.',
    icon: Briefcase,
    view: 'staff',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
];

export function RegistrationMenu({ onNavigate }: RegistrationMenuProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.view}
            className={cn(
              "cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01] border-l-4",
              item.bgColor,
              item.color.replace('text-', 'border-')
            )}
            onClick={() => onNavigate(item.view as any)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-gray-800">
                {item.title}
              </CardTitle>
              <Icon className={cn("h-6 w-6", item.color)} />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}