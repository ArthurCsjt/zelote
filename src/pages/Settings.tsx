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
import { LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme'; // Importando useTheme
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label'; // IMPORT FALTANTE

const Settings = () => {
  const { isAdmin, loading } = useProfileRole();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme(); // Usando useTheme
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      // Se for um usuário comum, apenas garante que ele não veja as partes de admin
    }
  }, [isAdmin, loading, navigate]);
  
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Funções de tema removidas, pois o tema é fixo em 'light'

  return (
    <Layout title="Configurações" subtitle="Gerencie configurações administrativas" showBackButton onBack={() => navigate(-1)}>
      <div className="max-w-5xl mx-auto grid gap-6 animate-fade-in">
        
        {/* Seções de Admin (visíveis apenas para Admin) */}
        {isAdmin ? (
          <>
            <UserManagement />
            <DataMaintenance />
            {/* Preferências do Sistema (Removido o seletor de tema) */}
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