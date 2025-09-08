import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, BarChart3, PlusCircle, Laptop, RotateCcw, Brain } from 'lucide-react';
interface MainMenuProps {
  onNavigate: (route: 'registration' | 'dashboard' | 'loan' | 'return' | 'inventory' | 'intelligent-reports') => void;
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
  const menuItems = [{
    title: 'Hub de Cadastros',
    icon: <PlusCircle className="h-5 w-5" />,
    action: () => onNavigate('registration'),
    bgColor: 'bg-green-500'
  }, {
    title: 'Hub de Inventário',
    icon: <Laptop className="h-5 w-5" />,
    action: () => onNavigate('inventory'),
    bgColor: 'bg-blue-500'
  }, {
    title: 'Empréstimos de Chromebook',
    icon: <ClipboardList className="h-5 w-5" />,
    action: () => onNavigate('loan'),
    bgColor: 'bg-purple-500'
  }, {
    title: 'Devolução',
    icon: <RotateCcw className="h-5 w-5" />,
    action: () => onNavigate('return'),
    bgColor: 'bg-orange-500'
  }, {
    title: 'Dashboard',
    icon: <BarChart3 className="h-5 w-5" />,
    action: () => onNavigate('dashboard'),
    bgColor: 'bg-red-500'
  }];
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
  return <div className="space-y-8 relative py-[20px]">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-card/50 via-background to-card/50 rounded-3xl blur-3xl transform scale-110" />
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-w-4xl mx-auto relative z-10">
        {menuItems.map((item, index) => <div key={index} style={getFadeInStyle(index)} className="group">
            <Button onClick={item.action} className={`w-full h-16 ${item.bgColor} hover:opacity-80 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02] border-0 flex flex-col items-center justify-center gap-1`}>
              {item.icon}
              <span className="text-xs">{item.title}</span>
            </Button>
          </div>)}
      </div>
    </div>;
}