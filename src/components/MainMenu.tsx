
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, BarChart3, PlusCircle, List } from 'lucide-react';

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
  disabled = false
}: MenuItemProps) => (
  <Card className="shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100">
    <div className={`h-2 w-full ${buttonColor ? buttonColor.replace('bg-', 'bg-').replace('-600', '-500') : 'bg-primary'}`}></div>
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between">
        <div>
          <CardTitle className={`text-xl font-bold ${buttonColor ? buttonColor.replace('bg-', 'text-').replace('-600', '-700') : 'text-primary'}`}>
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">{description}</CardDescription>
        </div>
        <div className={`p-2 rounded-full ${iconColor || buttonColor?.replace('bg-', 'bg-').replace('-600', '-100') || 'bg-primary/10'}`}>
          {React.cloneElement(buttonIcon as React.ReactElement, { 
            className: `h-5 w-5 ${buttonColor?.replace('bg-', 'text-').replace('-600', '-600') || 'text-primary'}` 
          })}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-500 mb-5 h-12">
        {content}
      </p>
      <Button 
        className={`w-full ${buttonColor || ''} transition-all duration-300 shadow-sm hover:shadow-md`}
        onClick={buttonAction}
        disabled={disabled}
      >
        {buttonIcon}
        <span className="ml-2">{buttonText}</span>
      </Button>
    </CardContent>
  </Card>
);

export function MainMenu({ onNavigate }: MainMenuProps) {
  const menuItems: MenuItemProps[] = [
    {
      title: 'Cadastro',
      description: 'Registrar novos Chromebooks',
      content: 'Cadastre novos dispositivos e gere QR Codes para identificação.',
      buttonText: 'Cadastrar Chromebook',
      buttonIcon: <PlusCircle className="mr-2 h-4 w-4" />,
      buttonAction: () => onNavigate('registration'),
      iconColor: 'bg-green-100'
    },
    {
      title: 'Inventário',
      description: 'Gerenciar Chromebooks',
      content: 'Visualize, edite ou altere o status dos dispositivos cadastrados.',
      buttonText: 'Ver Inventário',
      buttonIcon: <List className="mr-2 h-4 w-4" />,
      buttonAction: () => onNavigate('inventory'),
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      iconColor: 'bg-blue-100'
    },
    {
      title: 'Empréstimo',
      description: 'Gerenciar empréstimos',
      content: 'Registre novos empréstimos de Chromebooks e veja os ativos.',
      buttonText: 'Gerenciar Empréstimos',
      buttonIcon: <ClipboardList className="mr-2 h-4 w-4" />,
      buttonAction: () => onNavigate('loan'),
      buttonColor: 'bg-violet-600 hover:bg-violet-700',
      iconColor: 'bg-violet-100'
    },
    {
      title: 'Dashboard',
      description: 'Relatórios e estatísticas',
      content: 'Visualize dados e estatísticas sobre os equipamentos.',
      buttonText: 'Ver Dashboard',
      buttonIcon: <BarChart3 className="mr-2 h-4 w-4" />,
      buttonAction: () => onNavigate('dashboard'),
      buttonColor: 'bg-rose-600 hover:bg-rose-700',
      iconColor: 'bg-rose-100'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center mb-6">Sistema de Gerenciamento de Chromebooks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 p-4 max-w-4xl mx-auto">
        {menuItems.map((item, index) => (
          <div key={index} className="animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
            <MenuItem {...item} />
          </div>
        ))}
      </div>
    </div>
  );
}
