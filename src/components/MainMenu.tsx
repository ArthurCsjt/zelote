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
      gradient: 'from-emerald-400 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      iconBg: 'bg-emerald-100',
      textColor: 'text-emerald-800'
    },
    {
      title: 'Inventário',
      description: 'Gerenciar Chromebooks',
      content: 'Visualize, edite ou altere o status dos dispositivos cadastrados.',
      icon: <Laptop className="h-6 w-6" />,
      action: () => onNavigate('inventory'),
      gradient: 'from-blue-400 to-indigo-500',
      bgGradient: 'from-blue-50 to-indigo-50',
      iconBg: 'bg-blue-100',
      textColor: 'text-blue-800'
    },
    {
      title: 'Empréstimo',
      description: 'Gerenciar empréstimos',
      content: 'Registre novos empréstimos de Chromebooks e veja os ativos.',
      icon: <ClipboardList className="h-6 w-6" />,
      action: () => onNavigate('loan'),
      gradient: 'from-purple-400 to-violet-500',
      bgGradient: 'from-purple-50 to-violet-50',
      iconBg: 'bg-purple-100',
      textColor: 'text-purple-800'
    },
    {
      title: 'Devolução',
      description: 'Registrar devoluções',
      content: 'Registre a devolução de Chromebooks emprestados.',
      icon: <RotateCcw className="h-6 w-6" />,
      action: () => onNavigate('return'),
      gradient: 'from-amber-400 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50',
      iconBg: 'bg-amber-100',
      textColor: 'text-amber-800'
    },
    {
      title: 'Dashboard',
      description: 'Relatórios e estatísticas',
      content: 'Visualize dados e estatísticas sobre os equipamentos.',
      icon: <BarChart3 className="h-6 w-6" />,
      action: () => onNavigate('dashboard'),
      gradient: 'from-rose-400 to-pink-500',
      bgGradient: 'from-rose-50 to-pink-50',
      iconBg: 'bg-rose-100',
      textColor: 'text-rose-800'
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto relative z-10">
        {menuItems.map((item, index) => (
          <div 
            key={index} 
            style={getFadeInStyle(index)}
            className="group"
          >
            <Card className="relative overflow-hidden h-full border-0 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] bg-card/80 backdrop-blur-xl">
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-60`} />
              
              {/* Glass effect overlay */}
              <div className="absolute inset-0 bg-card/40 backdrop-blur-sm" />
              
              {/* Content */}
              <div className="relative z-10 p-6 h-full flex flex-col">
                {/* Icon and header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`${item.iconBg} p-3 rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    <div className={`bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                      {item.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${item.textColor} mb-1`}>
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-1">
                  {item.content}
                </p>
                
                {/* Action button */}
                <Button 
                  onClick={item.action}
                  className={`w-full bg-gradient-to-r ${item.gradient} hover:shadow-lg transform transition-all duration-300 hover:scale-[1.02] text-white border-0 rounded-xl font-medium py-3`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span>{item.title}</span>
                  </div>
                </Button>
              </div>

              {/* Floating orbs effect */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-card/20 to-transparent rounded-full blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-tr from-card/15 to-transparent rounded-full blur-lg" />
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}