import { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useNavigate } from 'react-router-dom';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserManagement } from './parts/UserManagement';
import { DataMaintenance } from '@/components/DataMaintenance';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EmailTestCard } from '@/components/EmailTestCard';

const Settings = () => {
  const { isAdmin, loading } = useProfileRole();
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
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

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout title="Configurações" subtitle="Gerencie configurações administrativas" showBackButton onBack={() => navigate(-1)}>
      <div className="space-y-6">

        {/* Header Neo-Brutalista */}
        <div className="neo-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-500 dark:bg-violet-600 border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Painel Administrativo</h2>
              <p className="text-sm font-bold text-muted-foreground uppercase">Configurações do Sistema</p>
            </div>
          </div>
        </div>

        {/* 1. Gerenciamento de Usuários */}
        <UserManagement />

        {/* 2. Manutenção de Dados */}
        <DataMaintenance />

        {/* 3. Teste de E-mail */}
        <EmailTestCard />

        {/* 4. Botão de Sair - Neo-Brutalista */}
        <div className="neo-card border-l-8 border-l-red-600 bg-red-50 dark:bg-red-950 p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-xl font-black uppercase tracking-tight text-red-700 dark:text-red-400">
              Sair do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Button
              onClick={handleLogout}
              className="w-full neo-btn bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wide h-12"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sair e Desconectar
            </Button>
          </CardContent>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;