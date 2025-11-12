import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// ALTERAÇÃO 1: Adicionado o ícone 'ListChecks' para o novo botão
import { ClipboardList, BarChart3, PlusCircle, Laptop, RotateCcw, Brain, ListChecks, QrCode, Calendar, Loader2 } from 'lucide-react'; // Adicionado Calendar e Loader2
import { useProfileRole } from '@/hooks/use-profile-role'; // NOVO IMPORT

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
  const { role, loading: roleLoading } = useProfileRole(); // Obtendo o cargo
  const [isLoaded, setIsLoaded] = useState(false);
  const isMobile = isMobileDevice();
  
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isProfessor = role === 'professor';

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const allMenuItems = [
    // Rotas de Empréstimo (Acesso para Admin)
    {
      title: 'Empréstimos',
      icon: <ClipboardList className="h-5 w-5" />,
      action: () => onNavigate('loan', 'form'),
      bgColor: 'bg-menu-violet', // Roxo
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Devolução',
      icon: <RotateCcw className="h-5 w-5" />,
      action: () => onNavigate('return'), 
      bgColor: 'bg-menu-amber', // Laranja
      roles: ['admin', 'super_admin']
    },
    // Rotas de Agendamento (Acesso para Admin e Professor)
    {
      title: 'Agendamento',
      icon: <Calendar className="h-5 w-5" />,
      action: () => onNavigate('scheduling'), 
      bgColor: 'bg-menu-dark-blue', // Azul Escuro
      roles: ['admin', 'super_admin', 'professor']
    },
    // Rotas de Inventário (Acesso para Admin)
    {
      title: 'Inventário',
      icon: <Laptop className="h-5 w-5" />,
      action: () => onNavigate('inventory'),
      bgColor: 'bg-menu-blue',
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Cadastros',
      icon: <PlusCircle className="h-5 w-5" />,
      action: () => onNavigate('registration'),
      bgColor: 'bg-menu-green',
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Sistema de Contagem',
      icon: <ListChecks className="h-5 w-5" />,
      action: () => onNavigate('audit'),
      bgColor: 'bg-menu-rose', // Rosa/Vermelho
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
      action: () => onNavigate('dashboard'),
      bgColor: 'bg-menu-teal', // ALTERADO PARA O NOVO AZUL ESCURO
      roles: ['admin', 'super_admin']
    },
  ];
  
  // Filtra os itens do menu com base no cargo do usuário
  const menuItemsFinal = allMenuItems.filter(item => item.roles.includes(role || 'user'));


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
  
  if (roleLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }
  
  // Se for professor, ele será redirecionado pelo Index.tsx, mas se por algum motivo cair aqui,
  // garantimos que ele veja apenas o menu de agendamento.
  if (isProfessor && menuItemsFinal.length === 1 && menuItemsFinal[0].title === 'Agendamento') {
      // Se for apenas o agendamento, não precisamos mostrar o menu, o Index.tsx já redireciona.
      return null;
  }

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
    </div>
  );
}