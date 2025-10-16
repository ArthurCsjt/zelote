import { useEffect, useState } from 'react';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserManagement } from './parts/UserManagement';
import { DataMaintenance } from '@/components/DataMaintenance';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Settings = () => {
  const { isAdmin, loading } = useProfileRole();
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      // Se não for admin, apenas garante que o usuário não veja as partes de admin
    }
  }, [isAdmin, loading, navigate]);
  
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in relative">
      
      <div className="grid gap-6">
        
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
          <GlassCard className="border-red-200/50 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-red-700">Acesso Negado</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Você não tem permissão de administrador para acessar estas configurações.
                </AlertDescription>
              </Alert>
            </CardContent>
          </GlassCard>
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
    </div>
  );
};

export default Settings;