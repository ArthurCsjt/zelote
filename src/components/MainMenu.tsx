
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, BarChart3, PlusCircle, List, Laptop, Settings, RotateCcw } from 'lucide-react';

interface MainMenuProps {
  onNavigate: (route: 'registration' | 'dashboard' | 'loan' | 'return' | 'inventory') => void;
}

type MenuItemProps = {
  title: string;
  description: string;
  content: string;
  buttonText: string;
  buttonIcon: React.ReactNode;
  buttonAction: () => void;
  buttonColor?: string;
  iconColor?: string;
  gradientBg?: string;
  disabled?: boolean;
};

const MenuItem = ({
  title,
  description,
  content,
  buttonText,
  buttonIcon,
  buttonAction,
  buttonColor = '',
  iconColor = '',
  gradientBg = '',
  disabled = false
}: MenuItemProps) => (
  <Card className="shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100 h-full group">
    <div className={`h-2 w-full ${buttonColor ? buttonColor.replace('bg-', 'bg-').replace('-600', '-500') : 'bg-primary'} transition-all duration-300 group-hover:h-3`}></div>
    <div className={`p-6 ${gradientBg || 'bg-white'} transition-colors duration-500`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className={`text-xl font-bold ${buttonColor ? buttonColor.replace('bg-', 'text-').replace('-600', '-700') : 'text-primary'} transition-transform duration-300 group-hover:translate-x-1`}>
            {title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 transition-opacity duration-300 group-hover:text-gray-700">{description}</p>
        </div>
        <div className={`p-3 rounded-full ${iconColor || buttonColor?.replace('bg-', 'bg-').replace('-600', '-100') || 'bg-primary/10'} transition-all duration-300 group-hover:scale-110`}>
          {React.cloneElement(buttonIcon as React.ReactElement, { 
            className: `h-6 w-6 ${buttonColor?.replace('bg-', 'text-').replace('-600', '-600') || 'text-primary'} transition-transform duration-300 group-hover:rotate-12` 
          })}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-6 h-12 transition-all duration-300 group-hover:text-gray-800">
        {content}
      </p>
      <Button 
        className={`w-full ${buttonColor || ''} transition-all duration-500 shadow-sm hover:shadow-md py-5 group-hover:translate-y-[-2px]`}
        onClick={buttonAction}
        disabled={disabled}
      >
        {React.cloneElement(buttonIcon as React.ReactElement, { 
          className: "mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" 
        })}
        <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">{buttonText}</span>
      </Button>
    </div>
  </Card>
);

export function MainMenu({ onNavigate }: MainMenuProps) {
  const menuItems: MenuItemProps[] = [
    {
      title: 'Cadastro',
      description: 'Registrar novos Chromebooks',
      content: 'Cadastre novos dispositivos e gere QR Codes para identificação.',
      buttonText: 'Cadastrar Chromebook',
      buttonIcon: <PlusCircle className="mr-2 h-5 w-5" />,
      buttonAction: () => onNavigate('registration'),
      iconColor: 'bg-green-100',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      gradientBg: 'bg-gradient-to-br from-white to-green-50'
    },
    {
      title: 'Inventário',
      description: 'Gerenciar Chromebooks',
      content: 'Visualize, edite ou altere o status dos dispositivos cadastrados.',
      buttonText: 'Ver Inventário',
      buttonIcon: <Laptop className="mr-2 h-5 w-5" />,
      buttonAction: () => onNavigate('inventory'),
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      iconColor: 'bg-blue-100',
      gradientBg: 'bg-gradient-to-br from-white to-blue-50'
    },
    {
      title: 'Empréstimo',
      description: 'Gerenciar empréstimos',
      content: 'Registre novos empréstimos de Chromebooks e veja os ativos.',
      buttonText: 'Gerenciar Empréstimos',
      buttonIcon: <ClipboardList className="mr-2 h-5 w-5" />,
      buttonAction: () => onNavigate('loan'),
      buttonColor: 'bg-violet-600 hover:bg-violet-700',
      iconColor: 'bg-violet-100',
      gradientBg: 'bg-gradient-to-br from-white to-violet-50'
    },
    {
      title: 'Devolução',
      description: 'Registrar devoluções',
      content: 'Registre a devolução de Chromebooks emprestados.',
      buttonText: 'Registrar Devolução',
      buttonIcon: <RotateCcw className="mr-2 h-5 w-5" />,
      buttonAction: () => onNavigate('return'),
      buttonColor: 'bg-amber-600 hover:bg-amber-700',
      iconColor: 'bg-amber-100',
      gradientBg: 'bg-gradient-to-br from-white to-amber-50'
    },
    {
      title: 'Dashboard',
      description: 'Relatórios e estatísticas',
      content: 'Visualize dados e estatísticas sobre os equipamentos.',
      buttonText: 'Ver Dashboard',
      buttonIcon: <BarChart3 className="mr-2 h-5 w-5" />,
      buttonAction: () => onNavigate('dashboard'),
      buttonColor: 'bg-rose-600 hover:bg-rose-700',
      iconColor: 'bg-rose-100',
      gradientBg: 'bg-gradient-to-br from-white to-rose-50'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center py-6 px-4 animate-fadeIn">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 mb-2 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          Sistema de Gerenciamento de Chromebooks
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          Gerencie o cadastro, empréstimo e devolução de Chromebooks de forma simples e eficiente
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4 max-w-6xl mx-auto">
        {menuItems.map((item, index) => (
          <div 
            key={index} 
            className="animate-fadeIn" 
            style={{ 
              animationDelay: `${index * 150}ms`,
              animation: `fadeIn 0.8s ease-out ${index * 150}ms both`
            }}
          >
            <MenuItem {...item} />
          </div>
        ))}
      </div>
    </div>
  );
}
