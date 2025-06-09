
import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, BarChart3, PlusCircle, Laptop, RotateCcw, Users } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

interface MainMenuProps {
  onNavigate: (route: 'registration' | 'dashboard' | 'loan' | 'return' | 'inventory' | 'user-management') => void;
}

export function MainMenu({ onNavigate }: MainMenuProps) {
  const [isLoaded, setIsLoaded] = useState(true); // Start as loaded to avoid useEffect
  const { isSuperAdmin, isLoading: profileLoading } = useUserProfile();

  // Memoizar itens do menu para evitar recriação
  const menuItems = useMemo(() => {
    const baseItems = [
      {
        title: 'Cadastro',
        description: 'Registrar novos Chromebooks',
        content: 'Cadastre novos dispositivos e gere QR Codes para identificação.',
        icon: PlusCircle,
        action: () => onNavigate('registration'),
        bgColor: 'bg-gradient-to-r from-green-500 to-green-600',
        textColor: 'text-green-700',
        hoverColor: 'hover:bg-green-700',
        borderColor: 'border-green-500'
      },
      {
        title: 'Inventário',
        description: 'Gerenciar Chromebooks',
        content: 'Visualize, edite ou altere o status dos dispositivos cadastrados.',
        icon: Laptop,
        action: () => onNavigate('inventory'),
        bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
        textColor: 'text-blue-700',
        hoverColor: 'hover:bg-blue-700',
        borderColor: 'border-blue-500'
      },
      {
        title: 'Empréstimo',
        description: 'Gerenciar empréstimos',
        content: 'Registre novos empréstimos de Chromebooks e veja os ativos.',
        icon: ClipboardList,
        action: () => onNavigate('loan'),
        bgColor: 'bg-gradient-to-r from-violet-500 to-violet-600',
        textColor: 'text-violet-700',
        hoverColor: 'hover:bg-violet-700',
        borderColor: 'border-violet-500'
      },
      {
        title: 'Devolução',
        description: 'Registrar devoluções',
        content: 'Registre a devolução de Chromebooks emprestados.',
        icon: RotateCcw,
        action: () => onNavigate('return'),
        bgColor: 'bg-gradient-to-r from-amber-500 to-amber-600',
        textColor: 'text-amber-700',
        hoverColor: 'hover:bg-amber-700',
        borderColor: 'border-amber-500'
      },
      {
        title: 'Dashboard',
        description: 'Relatórios e estatísticas',
        content: 'Visualize dados e estatísticas sobre os equipamentos.',
        icon: BarChart3,
        action: () => onNavigate('dashboard'),
        bgColor: 'bg-gradient-to-r from-rose-500 to-rose-600',
        textColor: 'text-rose-700',
        hoverColor: 'hover:bg-rose-700',
        borderColor: 'border-rose-500'
      }
    ];

    // Adicionar item de gerenciamento de usuários apenas para super admin
    if (isSuperAdmin && !profileLoading) {
      baseItems.push({
        title: 'Usuários',
        description: 'Gerenciar usuários e permissões',
        content: 'Gerencie papéis e permissões dos usuários do sistema.',
        icon: Users,
        action: () => onNavigate('user-management'),
        bgColor: 'bg-gradient-to-r from-purple-500 to-purple-600',
        textColor: 'text-purple-700',
        hoverColor: 'hover:bg-purple-700',
        borderColor: 'border-purple-500'
      });
    }

    return baseItems;
  }, [onNavigate, isSuperAdmin, profileLoading]);

  return (
    <div className="space-y-8">
      <div className="text-center py-6 px-4 opacity-100 transition-opacity duration-500">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 mb-2">
          Sistema de Gerenciamento de Chromebooks
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Gerencie o cadastro, empréstimo e devolução de Chromebooks de forma simples e eficiente
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div 
              key={item.title} 
              className="opacity-100 transition-opacity duration-500"
              style={{ 
                transitionDelay: `${index * 100}ms`
              }}
            >
              <Card className={`border-2 ${item.borderColor} bg-white overflow-hidden h-full shadow-sm hover:shadow-md transition-all`}>
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`mr-4 p-3 rounded-full ${item.textColor.replace('text-', 'bg-').replace('-700', '-100')}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${item.textColor}`}>
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {item.content}
                  </p>
                  <Button 
                    className={`w-full text-white ${item.bgColor} hover:opacity-90 transition-all`}
                    onClick={item.action}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    <span>{item.title}</span>
                  </Button>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
