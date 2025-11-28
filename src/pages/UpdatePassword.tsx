import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/GlassCard";
import { toast } from "@/hooks/use-toast";
import { LockKeyhole, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { cn } from "@/lib/utils";

const renderMinimalHeader = (title: string, description: string, Icon: React.ElementType) => (
  <CardHeader className="space-y-2 text-center pb-6 pt-8">
    <div className="flex justify-center mb-4">
      <div className="p-3 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/10">
        <Icon className="h-8 w-8" />
      </div>
    </div>
    <CardTitle className="text-3xl font-bold tracking-tight text-foreground">{title}</CardTitle>
    {description && <CardDescription className="text-base text-muted-foreground">{description}</CardDescription>}
  </CardHeader>
);

const UpdatePasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionSet, setIsSessionSet] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Tenta definir a sessão a partir do hash da URL
  useEffect(() => {
    const params = new URLSearchParams(location.hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      setIsLoading(true);
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (error) {
            toast({ title: "Erro de acesso", description: "Token inválido ou expirado. Tente redefinir a senha novamente.", variant: "destructive" });
            navigate('/login', { replace: true });
          } else if (data.session) {
            setIsSessionSet(true);
            // Limpa o hash da URL após definir a sessão
            navigate(location.pathname, { replace: true }); 
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
        // Se não houver tokens, verifica se já está logado
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsSessionSet(true);
            } else {
                // Se não houver tokens e nem sessão, redireciona para login
                navigate('/login', { replace: true });
            }
        });
    }
  }, [location, navigate]);

  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      // Atualiza a senha do usuário logado (a sessão foi definida no useEffect)
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      toast({ title: "Sucesso!", description: "Sua senha foi definida. Você será redirecionado para o menu principal." });

      // Redireciona para a página principal APENAS após a atualização bem-sucedida
      navigate("/", { replace: true });
    } catch (error: any) {
      toast({ title: "Erro ao definir senha", description: error.message || "Não foi possível atualizar a senha. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading || !isSessionSet) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Verificando acesso seguro...</p>
            </div>
        </div>
    );
  }

  return (
    <Layout title="Nova Senha" subtitle="Defina sua nova senha de acesso" showBackButton onBack={() => navigate('/login')}>
        <div className="flex items-center justify-center p-4 relative overflow-hidden">
            <GlassCard className="w-full max-w-md border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-2xl relative z-10">
                <form onSubmit={handleUpdatePasswordSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {renderMinimalHeader(
                        "Definir Nova Senha",
                        "Crie uma senha segura para acessar o sistema.",
                        LockKeyhole
                    )}
                    <CardContent className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Nova Senha</Label>
                            <div className="relative">
                                <Input id="new-password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} className="bg-white/50 dark:bg-zinc-900/50 pr-10" disabled={isLoading} required />
                                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(prev => !prev)}>
                                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmar Senha</Label>
                            <div className="relative">
                                <Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="Confirme sua nova senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-white/50 dark:bg-zinc-900/50 pr-10" disabled={isLoading} required />
                                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(prev => !prev)}>
                                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pb-8">
                        <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20" disabled={isLoading || password.length < 6 || password !== confirmPassword}>
                            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Definir Senha e Entrar"}
                        </Button>
                    </CardFooter>
                </form>
            </GlassCard>
        </div>
    </Layout>
  );
};

export default UpdatePasswordPage;