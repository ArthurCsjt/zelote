import { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Settings = () => {
  const { isSuperAdmin, loading } = useProfileRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      navigate('/', { replace: true });
    }
  }, [isSuperAdmin, loading, navigate]);

  return (
    <Layout title="Configurações" subtitle="Gerencie configurações administrativas" showBackButton onBack={() => navigate(-1)}>
      <div className="max-w-5xl mx-auto grid gap-6 animate-fade-in">
        {!isSuperAdmin ? (
          <Alert>
            <AlertDescription>
              Você não tem permissão para acessar esta página.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Apenas o super administrador pode criar usuários e definir perfis de acesso.
                </p>
                <Badge variant="secondary">Em breve</Badge>
              </CardContent>
            </Card>

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
