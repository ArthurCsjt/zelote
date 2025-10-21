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

  const getThemeIcon = (currentTheme: string) => {
    switch (currentTheme) {
      case 'dark':
        return <Moon className="h-4 w-4 mr-2" />;
      case 'system':
        return <Monitor className="h-4 w-4 mr-2" />;
      case 'light':
      default:
        return <Sun className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <Layout title="Configurações" subtitle="Gerencie configurações administrativas" showBackButton onBack={() => navigate(-1)}>
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme-select">Tema da Interface</Label>
                  <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
                    <SelectTrigger id="theme-select" className="w-[200px]">
                      <div className="flex items-center">
                        {getThemeIcon(theme)}
                        <SelectValue placeholder="Selecionar tema" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center"><Sun className="h-4 w-4 mr-2" /> Claro</div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center"><Moon className="h-4 w-4 mr-2" /> Escuro</div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center"><Monitor className="h-4 w-4 mr-2" /> Sistema</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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