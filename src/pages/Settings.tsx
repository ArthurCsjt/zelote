import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserManagement } from './parts/UserManagement';
import { DataMaintenance } from '@/components/DataMaintenance'; // Importando o novo componente
import { GlassCard } from '@/components/ui/GlassCard'; // Importando GlassCard
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Settings = () => {
  const { isAdmin, loading } = useProfileRole();
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona se o usuário não for admin e a página for carregada
    // Mantemos o acesso para que usuários comuns possam ver o botão de Sair
    if (!loading && !isAdmin) {
      // Se for um usuário comum, apenas garante que ele não veja as partes de admin
    }
  }, [isAdmin, loading, navigate]);
  
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // NOVO HANDLER: Força a navegação para a raiz (menu principal)
  const handleBackToMenu = () => {
    navigate('/', { replace: true });
  };

  return (
    <Layout 
      title="Configurações" 
      subtitle="Gerencie configurações administrativas" 
      showBackButton 
      onBack={handleBackToMenu} // Usando o novo handler
    >
      <div className="max-w-5xl mx-auto grid gap-6 animate-fade-in">
        
        {/* Seções de Admin (visíveis apenas para Admin) */}
        {isAdmin ? (
          <>
            <UserManagement />
            <DataMaintenance />
            <GlassCard>
              <CardHeader>
                <CardTitle>Preferências do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Modo claro ativado permanentemente.</p>
              </CardContent>
            </GlassCard>
          </>
        ) : (
          <Alert>
            <AlertDescription>
              Você não tem permissão de administrador. Apenas o botão de Sair está disponível.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Botão de Sair (Visível para todos) */}
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