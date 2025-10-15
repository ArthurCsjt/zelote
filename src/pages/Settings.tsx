import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserManagement } from './parts/UserManagement';
import { DataMaintenance } from '@/components/DataMaintenance'; // Importando o novo componente

const Settings = () => {
  const { isAdmin, loading } = useProfileRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, loading, navigate]);

  return (
    <Layout title="Configurações" subtitle="Gerencie configurações administrativas" showBackButton onBack={() => navigate(-1)}>
      <div className="max-w-5xl mx-auto grid gap-6 animate-fade-in">
        {!isAdmin ? (
          <Alert>
            <AlertDescription>
              Você não tem permissão para acessar esta página.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <UserManagement />
            <DataMaintenance />
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Preferências do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Modo claro ativado permanentemente.</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Settings;