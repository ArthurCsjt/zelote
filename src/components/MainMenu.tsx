
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, BarChart3, PlusCircle, RotateCCW, ArchiveRestore, List } from 'lucide-react';

interface MainMenuProps {
  onNavigate: (route: 'registration' | 'dashboard' | 'loan' | 'return' | 'inventory') => void;
}

export function MainMenu({ onNavigate }: MainMenuProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {/* Card for Chromebook Registration */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-green-700">Cadastro</CardTitle>
          <CardDescription>Registrar novos Chromebooks</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Cadastre novos dispositivos e gere QR Codes para identificação.
          </p>
          <Button 
            className="w-full"
            onClick={() => onNavigate('registration')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Cadastrar Chromebook
          </Button>
        </CardContent>
      </Card>

      {/* Card for Inventory */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-blue-700">Inventário</CardTitle>
          <CardDescription>Gerenciar Chromebooks</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Visualize, edite ou altere o status dos dispositivos cadastrados.
          </p>
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => onNavigate('inventory')}
          >
            <List className="mr-2 h-4 w-4" />
            Ver Inventário
          </Button>
        </CardContent>
      </Card>

      {/* Card for Loan */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-violet-700">Empréstimo</CardTitle>
          <CardDescription>Gerenciar empréstimos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Registre novos empréstimos de Chromebooks e veja os ativos.
          </p>
          <Button 
            className="w-full bg-violet-600 hover:bg-violet-700"
            onClick={() => onNavigate('loan')}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Gerenciar Empréstimos
          </Button>
        </CardContent>
      </Card>

      {/* Card for Return */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-amber-700">Devolução</CardTitle>
          <CardDescription>Registrar devoluções</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Registre a devolução de Chromebooks emprestados.
          </p>
          <Button 
            className="w-full bg-amber-600 hover:bg-amber-700"
            onClick={() => onNavigate('return')}
          >
            <RotateCCW className="mr-2 h-4 w-4" />
            Registrar Devolução
          </Button>
        </CardContent>
      </Card>

      {/* Card for Restore */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-indigo-700">Restauração</CardTitle>
          <CardDescription>Recuperar dispositivos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Restaure Chromebooks para o estado original de fábrica.
          </p>
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled
          >
            <ArchiveRestore className="mr-2 h-4 w-4" />
            Restaurar Dispositivo
          </Button>
        </CardContent>
      </Card>

      {/* Card for Reports */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-rose-700">Dashboard</CardTitle>
          <CardDescription>Relatórios e estatísticas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Visualize dados e estatísticas sobre os equipamentos.
          </p>
          <Button 
            className="w-full bg-rose-600 hover:bg-rose-700"
            onClick={() => onNavigate('dashboard')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Ver Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
