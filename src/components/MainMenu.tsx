import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// ALTERAÇÃO 1: Adicionado o ícone 'ListChecks' para o novo botão
import { ClipboardList, BarChart3, PlusCircle, Laptop, RotateCcw, Brain, ListChecks, QrCode, Calendar } from 'lucide-react'; // Adicionado Calendar
// import { AppBenefits } from './AppBenefits'; // REMOVIDO

interface MainMenuProps {
  // ALTERAÇÃO 2: Reintroduzindo 'return' como rota de nível superior
  onNavigate: (route: 'registration' | 'dashboard' | 'loan' | 'inventory' | 'audit' | 'quick-register' | 'return' | 'scheduling', tab?: 'form' | 'active') => void;
}

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
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

  const menuItemsFinal = [
    {
      title: 'Empréstimos',
      icon: <ClipboardList className="h-5 w-5" />,
      action: () => onNavigate('loan', 'form'),
      bgColor: 'bg-menu-violet' // Roxo
    },
    {
      title: 'Devolução',
      icon: <RotateCcw className="h-5 w-5" />,
      action: () => onNavigate('return'), 
      bgColor: 'bg-menu-amber' // Laranja
    },
    {
      title: 'Agendamento', // NOVO ITEM
      icon: <Calendar className="h-5 w-5" />,
      action: () => window.location.href = '/agendamento', // Navegação direta para a rota
      bgColor: 'bg-menu-dark-blue' // Azul Escuro
    },
    {
      title: 'Inventário',
      icon: <Laptop className="h-5 w-5" />,
      action: () => onNavigate('inventory'),
      bgColor: 'bg-menu-blue'
    },
    {
      title: 'Cadastros',
      icon: <PlusCircle className="h-5 w-5" />,
      action: () => onNavigate('registration'),
      bgColor: 'bg-menu-green'
    },
    {
      title: 'Sistema de Contagem',
      icon: <ListChecks className="h-5 w-5" />,
      action: () => onNavigate('audit'),
      bgColor: 'bg-menu-rose' // Rosa/Vermelho
    },
    {
      title: 'Dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
      action: () => onNavigate('dashboard'),
      bgColor: 'bg-menu-teal' // ALTERADO PARA O NOVO AZUL ESCURO
    },
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
      {/* Removendo o gradiente de sobreposição para que o fundo do body seja visível */}
      <div className="absolute inset-0 -z-10 bg-transparent blur-2xl transform scale-110 py-[25px] rounded-3xl bg-[#000a0e]/0" />
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-w-4xl mx-auto relative z-10">
        {menuItemsFinal.map((item, index) => (
          <div key={index} style={getFadeInStyle(index)} className="group">
            <Button
              onClick={item.action}
              // Aumentando a saturação e o efeito de sombra
              className={`w-full h-20 ${item.bgColor} hover:${item.bgColor.replace('bg-menu-', 'bg-menu-').replace('DEFAULT', 'hover')} text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:scale-[1.05] border-0 flex flex-col items-center justify-center gap-1`}
            >
              {item.icon}
              <span className="text-sm">{item.title}</span>
            </Button>
          </div>
        ))}
      </div>
      
      {/* NOVO: Seção de Benefícios */}
      {/* <AppBenefits /> REMOVIDO */}
    </div>
  );
}