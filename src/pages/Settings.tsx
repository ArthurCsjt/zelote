import { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useNavigate } from 'react-router-dom';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserManagement } from './parts/UserManagement';
import { DataMaintenance } from '@/components/DataMaintenance';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EmailTestCard } from '@/components/EmailTestCard'; // NOVO IMPORT

const Settings = () => {
  const { isAdmin, loading } = useProfileRole();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Redireciona se o usuário não for admin e o carregamento terminar
  useEffect(() => {
    if (!loading && !isAdmin) {
      // Se o usuário não for admin, redireciona para a página inicial
      navigate('/', { replace: true });
    }
  }, [isAdmin, loading, navigate]);
  
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <Layout title="Configurações" subtitle="Carregando permissões..." showBackButton onBack={() => navigate(-1)}>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Se o usuário não for admin, o useEffect acima já o redirecionou.
  // Este bloco é um fallback de segurança.
  if (!isAdmin) {
    return null; 
  }

  return (
    <Layout title="Configurações" subtitle="Gerencie configurações administrativas" showBackButton onBack={() => navigate(-1)}>
      {/* Removido max-w-5xl mx-auto grid gap-6. Usando espaçamento vertical simples. */}
      <div className="space-y-6">
        
        <div className="flex items-center gap-3 mb-4">
            <SettingsIcon className="h-7 w-7 text-primary" />
            <h2 className="text-2xl font-bold text-gray-800">Painel Administrativo</h2>
        </div>
        
        {/* 1. Gerenciamento de Usuários (Convites e Roles) */}
        <UserManagement />
        
        {/* 2. Manutenção de Dados (Importação e Limpeza) */}
        <DataMaintenance />
        
        {/* 3. Teste de E-mail */}
        <EmailTestCard />
        
        {/* 4. Botão de Sair (Visível para todos, mas colocado aqui para consistência) */}
        <GlassCard className="border-red-200/50 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-700">Sair do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair e Desconectar
            </Button>
          </CardContent>
        </GlassCard>
      </div>
    </Layout>
  );
};

export default Settings;