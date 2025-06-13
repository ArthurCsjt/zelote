
import React from 'react';
import { ResponsiveText } from './ResponsiveText';
import { ResponsiveGrid } from './ResponsiveGrid';
import { MobileOptimizedCard } from './MobileOptimizedCard';
import { TouchFriendlyButton } from './TouchFriendlyButton';
import { Computer, BarChart, Users, Package, ArrowLeft, Settings } from "lucide-react";

interface MainMenuProps {
  onNavigate: (route: 'registration' | 'dashboard' | 'loan' | 'return' | 'inventory' | 'user-management') => void;
}

const menuItems = [
  {
    id: 'loan' as const,
    title: 'Empréstimos',
    description: 'Gerenciar empréstimos de Chromebooks',
    icon: Computer,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'dashboard' as const,
    title: 'Dashboard',
    description: 'Visualizar estatísticas e relatórios',
    icon: BarChart,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'inventory' as const,
    title: 'Inventário',
    description: 'Gerenciar estoque de Chromebooks',
    icon: Package,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'registration' as const,
    title: 'Cadastro',
    description: 'Cadastrar novos Chromebooks',
    icon: Settings,
    color: 'from-orange-500 to-orange-600',
  },
  {
    id: 'user-management' as const,
    title: 'Usuários',
    description: 'Gerenciar usuários do sistema',
    icon: Users,
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    id: 'return' as const,
    title: 'Devoluções',
    description: 'Processar devoluções',
    icon: ArrowLeft,
    color: 'from-red-500 to-red-600',
  },
];

export function MainMenu({ onNavigate }: MainMenuProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-4 px-4">
        <ResponsiveText variant="h1" className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Zelote
        </ResponsiveText>
        <ResponsiveText variant="body" className="text-gray-600 max-w-2xl mx-auto">
          Sistema de Gerenciamento de Chromebooks
        </ResponsiveText>
      </div>

      {/* Menu Grid */}
      <ResponsiveGrid 
        cols={{ default: 1, sm: 2, lg: 3 }}
        gap={4}
        className="px-2 sm:px-4"
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <MobileOptimizedCard
              key={item.id}
              className="group hover:scale-[1.02] transition-all duration-200 cursor-pointer"
              touchFriendly
            >
              <TouchFriendlyButton
                variant="ghost"
                className="w-full h-full p-4 sm:p-6 text-left justify-start hover:bg-transparent"
                onClick={() => onNavigate(item.id)}
              >
                <div className="space-y-3 sm:space-y-4 w-full">
                  {/* Icon */}
                  <div className={`
                    w-12 h-12 sm:w-14 sm:h-14 rounded-xl 
                    bg-gradient-to-r ${item.color}
                    flex items-center justify-center
                    group-hover:scale-110 transition-transform duration-200
                  `}>
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-1 sm:space-y-2">
                    <ResponsiveText variant="h4" className="text-gray-900 group-hover:text-blue-600">
                      {item.title}
                    </ResponsiveText>
                    <ResponsiveText variant="caption" className="text-gray-500">
                      {item.description}
                    </ResponsiveText>
                  </div>
                </div>
              </TouchFriendlyButton>
            </MobileOptimizedCard>
          );
        })}
      </ResponsiveGrid>
    </div>
  );
}
