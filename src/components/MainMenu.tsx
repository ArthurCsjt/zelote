import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, BarChart3, PlusCircle, Laptop, RotateCcw } from 'lucide-react';

interface MainMenuProps {
  onNavigate: (route: 'registration' | 'dashboard' | 'loan' | 'return' | 'inventory') => void;
}

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export function MainMenu({ onNavigate }: MainMenuProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const isMobile = isMobileDevice();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const menuItems = [
    {
      title: 'Cadastro',
      description: 'Registrar novos Chromebooks',
      content: 'Cadastre novos dispositivos e gere QR Codes para identificação.',
      icon: <PlusCircle className="h-6 w-6" />,
      action: () => onNavigate('registration'),
      bgColor: 'bg-green-500',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      cardBg: 'bg-green-50/80 dark:bg-green-950/30'
    },
    {
      title: 'Inventário',
      description: 'Gerenciar Chromebooks',
      content: 'Visualize, edite ou altere o status dos dispositivos cadastrados.',
      icon: <Laptop className="h-6 w-6" />,
      action: () => onNavigate('inventory'),
      bgColor: 'bg-blue-500',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      cardBg: 'bg-blue-50/80 dark:bg-blue-950/30'
    },
    {
      title: 'Empréstimo',
      description: 'Gerenciar empréstimos',
      content: 'Registre novos empréstimos de Chromebooks e veja os ativos.',
      icon: <ClipboardList className="h-6 w-6" />,
      action: () => onNavigate('loan'),
      bgColor: 'bg-purple-500',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      cardBg: 'bg-purple-50/80 dark:bg-purple-950/30'
    },
    {
      title: 'Devolução',
      description: 'Registrar devoluções',
      content: 'Registre a devolução de Chromebooks emprestados.',
      icon: <RotateCcw className="h-6 w-6" />,
      action: () => onNavigate('return'),
      bgColor: 'bg-orange-500',
      buttonColor: 'bg-orange-600 hover:bg-orange-700',
      cardBg: 'bg-orange-50/80 dark:bg-orange-950/30'
    },
    {
      title: 'Dashboard',
      description: 'Relatórios e estatísticas',
      content: 'Visualize dados e estatísticas sobre os equipamentos.',
      icon: <BarChart3 className="h-6 w-6" />,
      action: () => onNavigate('dashboard'),
      bgColor: 'bg-red-500',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      cardBg: 'bg-red-50/80 dark:bg-red-950/30'
    }
  ];

  const getFadeInStyle = (index: number) => {
    if (!isLoaded) return { opacity: 0, transform: 'translateY(20px)' };
    
    return { 
      opacity: 1,
      transform: 'translateY(0)',
      transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 150}ms`
    };
  };

  return (
    <div className="space-y-8 relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-card/50 via-background to-card/50 rounded-3xl blur-3xl transform scale-110" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto relative z-10">
        {menuItems.map((item, index) => (
          <div 
            key={index} 
            style={getFadeInStyle(index)}
            className="group"
          >
            <Card className={`relative overflow-hidden h-full border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] ${item.cardBg} backdrop-blur-xl`}>
              {/* Content */}
              <div className="relative z-10 p-6 h-full flex flex-col text-center">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <div className="text-gray-700 dark:text-gray-200">
                      {item.icon}
                    </div>
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {item.title}
                </h3>
                
                {/* Subtitle */}
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-3">
                  {item.description}
                </p>
                
                {/* Description */}
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed flex-1">
                  {item.content}
                </p>
                
                {/* Action button */}
                <Button 
                  onClick={item.action}
                  className={`w-full ${item.buttonColor} text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02] border-0`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                </Button>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}