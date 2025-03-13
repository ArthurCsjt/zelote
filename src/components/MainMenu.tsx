
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, BarChart3, PlusCircle, RotateCcw, List } from 'lucide-react';

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
  disabled = false
}: MenuItemProps) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="pb-2">
      <CardTitle className={`text-xl ${buttonColor ? buttonColor.replace('bg-', 'text-').replace('-600', '-700') : 'text-primary'}`}>
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-500 mb-4">
        {content}
      </p>
      <Button 
        className={`w-full ${buttonColor || ''}`}
        onClick={buttonAction}
        disabled={disabled}
      >
        {buttonIcon}
        {buttonText}
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
      buttonAction: () => onNavigate('registration')
    },
    {
      title: 'Inventário',
      description: 'Gerenciar Chromebooks',
      content: 'Visualize, edite ou altere o status dos dispositivos cadastrados.',
      buttonText: 'Ver Inventário',
      buttonIcon: <List className="mr-2 h-4 w-4" />,
      buttonAction: () => onNavigate('inventory'),
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Empréstimo',
      description: 'Gerenciar empréstimos',
      content: 'Registre novos empréstimos de Chromebooks e veja os ativos.',
      buttonText: 'Gerenciar Empréstimos',
      buttonIcon: <ClipboardList className="mr-2 h-4 w-4" />,
      buttonAction: () => onNavigate('loan'),
      buttonColor: 'bg-violet-600 hover:bg-violet-700'
    },
    {
      title: 'Devolução',
      description: 'Registrar devoluções',
      content: 'Registre a devolução de Chromebooks emprestados.',
      buttonText: 'Registrar Devolução',
      buttonIcon: <RotateCcw className="mr-2 h-4 w-4" />,
      buttonAction: () => onNavigate('return'),
      buttonColor: 'bg-amber-600 hover:bg-amber-700'
    },
    {
      title: 'Dashboard',
      description: 'Relatórios e estatísticas',
      content: 'Visualize dados e estatísticas sobre os equipamentos.',
      buttonText: 'Ver Dashboard',
      buttonIcon: <BarChart3 className="mr-2 h-4 w-4" />,
      buttonAction: () => onNavigate('dashboard'),
      buttonColor: 'bg-rose-600 hover:bg-rose-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {menuItems.map((item, index) => (
        <MenuItem key={index} {...item} />
      ))}
    </div>
  );
}
