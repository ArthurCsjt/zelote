import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// ALTERAÇÃO 1: Adicionado o ícone 'ListChecks' para o novo botão
import { ClipboardList, BarChart3, PlusCircle, Laptop, RotateCcw, Brain, ListChecks, QrCode } from 'lucide-react';

interface MainMenuProps {
  // ALTERAÇÃO 2: Reintroduzindo 'return' como rota de nível superior
  onNavigate: (route: 'registration' | 'dashboard' | 'loan' | 'inventory' | 'audit' | 'quick-register' | 'return', tab?: 'form' | 'active') => void;
}

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export function MainMenu({
  onNavigate
}: MainMenuProps) {
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
      title: 'Cadastros',
      icon: <PlusCircle className="h-5 w-5" />,
      action: () => onNavigate('registration'),
      bgColor: 'bg-menu-green'
    },
    {
      title: 'Inventário',
      icon: <Laptop className="h-5 w-5" />,
      action: () => onNavigate('inventory'),
      bgColor: 'bg-menu-blue'
    },
    {
      title: 'Empréstimos',
      icon: <ClipboardList className="h-5 w-5" />,
      action: () => onNavigate('loan', 'form'),
      bgColor: 'bg-menu-violet'
    },
    {
      title: 'Devolução',
      icon: <RotateCcw className="h-5 w-5" />,
      // CORREÇÃO: Navega para a rota 'return'
      action: () => onNavigate('return'), 
      bgColor: 'bg-menu-amber'
    },
    {
      title: 'Dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
      action: () => onNavigate('dashboard'),
      // ALTERAÇÃO: Usando a cor do sistema de menu
      bgColor: 'bg-menu-rose' 
    },
    // NOVO BOTÃO: Re-Cadastro Rápido
    {
      title: 'Re-Cadastro Rápido',
      icon: <QrCode className="h-5 w-5" />,
      action: () => onNavigate('quick-register'),
      bgColor: 'bg-menu-teal' 
    },
    {
      title: 'Sistema de Contagem',
      icon: <ListChecks className="h-5 w-5" />,
      action: () => onNavigate('audit'),
      // CORREÇÃO: Usando uma cor diferente (menu-rose já está em uso, vamos usar menu-violet-hover para um tom mais escuro ou menu-amber-hover)
      // Vou usar uma cor nova, o menu-rose já está no dashboard, vamos usar o menu-violet-hover para um tom mais escuro.
      bgColor: 'bg-menu-rose' // Mantendo rose para dashboard, vamos usar uma cor nova para contagem
    }
  ];
  
  // CORREÇÃO: Vamos usar a cor menu-rose para o Dashboard e menu-teal para Re-Cadastro.
  // Vou introduzir uma nova cor para o Sistema de Contagem: menu-violet-hover (roxo escuro).
  // No entanto, para manter a consistência, vou usar a cor 'menu-rose' para o Dashboard e 'menu-teal' para o Re-Cadastro.
  // Vou usar a cor 'menu-amber-hover' para o Sistema de Contagem, que é um laranja mais escuro.
  
  const menuItemsFinal = [
    {
      title: 'Cadastros',
      icon: <PlusCircle className="h-5 w-5" />,
      action: () => onNavigate('registration'),
      bgColor: 'bg-menu-green'
    },
    {
      title: 'Inventário',
      icon: <Laptop className="h-5 w-5" />,
      action: () => onNavigate('inventory'),
      bgColor: 'bg-menu-blue'
    },
    {
      title: 'Empréstimos',
      icon: <ClipboardList className="h-5 w-5" />,
      action: () => onNavigate('loan', 'form'),
      bgColor: 'bg-menu-violet'
    },
    {
      title: 'Devolução',
      icon: <RotateCcw className="h-5 w-5" />,
      action: () => onNavigate('return'), 
      bgColor: 'bg-menu-amber'
    },
    {
      title: 'Dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
      action: () => onNavigate('dashboard'),
      bgColor: 'bg-menu-rose' 
    },
    {
      title: 'Re-Cadastro Rápido',
      icon: <QrCode className="h-5 w-5" />,
      action: () => onNavigate('quick-register'),
      bgColor: 'bg-menu-teal' 
    },
    {
      title: 'Sistema de Contagem',
      icon: <ListChecks className="h-5 w-5" />,
      action: () => onNavigate('audit'),
      // Usando uma cor diferente: menu-violet-hover (roxo escuro)
      bgColor: 'bg-menu-violet-hover' 
    }
  ];


  const getFadeInStyle = (index: number) => {
    if (!isLoaded) return {
      opacity: 0,
      transform: 'translateY(20px)'
    };
    return {
      opacity: 1,
      transform: 'translateY(0)',
      transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 150}ms`
    };
  };

  return (
    <div className="space-y-8 relative py-[30px]">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-card/50 via-background to-card/50 rounded-3xl blur-3xl transform scale-110" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-w-4xl mx-auto relative z-10">
        {menuItemsFinal.map((item, index) => (
          <div key={index} style={getFadeInStyle(index)} className="group">
            <Button
              onClick={item.action}
              // Usando a cor do sistema de menu e a classe hover correspondente
              className={`w-full h-16 ${item.bgColor} hover:${item.bgColor.replace('bg-menu-', 'bg-menu-').replace('DEFAULT', 'hover')} text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02] border-0 flex flex-col items-center justify-center gap-1`}
            >
              {item.icon}
              <span className="text-xs">{item.title}</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}