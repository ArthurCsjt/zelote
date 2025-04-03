
import React, { useEffect, useState } from 'react';
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

// Detect if we're on a mobile device
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
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
}: MenuItemProps) => {
  const isMobile = isMobileDevice();
  
  // Simplified animations for mobile
  const animationClasses = isMobile 
    ? "transition-colors duration-300"
    : "shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2";

  // Simplified hover effects for mobile
  const cardHoverClasses = isMobile ? "" : "group";
  
  // Use simpler gradient background on mobile
  const bgClass = isMobile 
    ? "bg-white" 
    : (gradientBg || 'bg-white');

  return (
    <Card className={`border border-gray-100 h-full overflow-hidden ${animationClasses} ${cardHoverClasses}`}>
      <div className={`h-2 w-full ${buttonColor ? buttonColor.replace('bg-', 'bg-').replace('-600', '-500') : 'bg-primary'}`}></div>
      <div className={`p-6 ${bgClass}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className={`text-xl font-bold ${buttonColor ? buttonColor.replace('bg-', 'text-').replace('-600', '-700') : 'text-primary'}`}>
              {title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <div className={`p-3 rounded-full ${iconColor || buttonColor?.replace('bg-', 'bg-').replace('-600', '-100') || 'bg-primary/10'}`}>
            {React.cloneElement(buttonIcon as React.ReactElement, { 
              className: `h-6 w-6 ${buttonColor?.replace('bg-', 'text-').replace('-600', '-600') || 'text-primary'}` 
            })}
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6 h-12">
          {content}
        </p>
        <Button 
          className={`w-full ${buttonColor || ''} shadow-sm py-5`}
          onClick={buttonAction}
          disabled={disabled}
        >
          {React.cloneElement(buttonIcon as React.ReactElement, { 
            className: "mr-2 h-5 w-5" 
          })}
          <span className="ml-2">{buttonText}</span>
        </Button>
      </div>
    </Card>
  );
};

export function MainMenu({ onNavigate }: MainMenuProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const isMobile = isMobileDevice();

  useEffect(() => {
    // Delay animation start to improve initial load performance
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

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

  // Simple fade-in animation that works better on mobile
  const getFadeInStyle = (index: number) => {
    if (!isLoaded) return { opacity: 0 };
    
    // Use a simpler animation approach on mobile
    if (isMobile) {
      return { 
        opacity: 1,
        transition: `opacity 0.5s ease-out ${index * 100}ms`
      };
    }
    
    // More elaborate animation for desktop
    return { 
      opacity: 1,
      transform: 'translateY(0)',
      transition: `opacity 0.8s ease-out ${index * 150}ms, transform 0.8s ease-out ${index * 150}ms`
    };
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-6 px-4" style={getFadeInStyle(0)}>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 mb-2">
          Sistema de Gerenciamento de Chromebooks
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Gerencie o cadastro, empréstimo e devolução de Chromebooks de forma simples e eficiente
        </p>
      </div>
      
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 p-4 max-w-6xl mx-auto`}>
        {menuItems.map((item, index) => (
          <div 
            key={index} 
            style={getFadeInStyle(index + 1)}
          >
            <MenuItem {...item} />
          </div>
        ))}
      </div>
    </div>
  );
}
