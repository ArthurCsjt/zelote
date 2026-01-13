import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { validatePassword } from "@/utils/passwordValidation";
import { LockKeyhole, Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { cn } from "@/lib/utils";

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
            // Limpa o hash da URL após definir a sessão para evitar re-processamento
            navigate(location.pathname, { replace: true });
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Se não houver tokens no hash, verifica se já existe uma sessão ativa (caso o Supabase tenha processado automaticamente)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsSessionSet(true);
        } else {
          // Sem tokens e sem sessão -> Login
          navigate('/login', { replace: true });
        }
      });
    }
  }, [location.pathname, location.hash, navigate]);

  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!validatePassword(password).isValid) {
      toast({ title: "Erro", description: "A senha não atende aos requisitos de segurança.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      toast({ title: "Sucesso!", description: "Sua senha foi redefinida com sucesso. Bem-vindo(a) de volta!" });
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
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="font-bold uppercase tracking-tight">Verificando acesso seguro...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Nova Senha" subtitle="Defina sua nova senha de acesso" showBackButton onBack={() => navigate('/login')}>
      <div className="flex items-center justify-center p-4 relative overflow-hidden h-full min-h-[60vh]">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 -rotate-12 translate-x-10 -translate-y-10 border-2 border-primary/20" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-success/10 rotate-45 -translate-x-10 translate-y-10 border-2 border-success/20" />

        <div className="w-full max-w-md relative z-10">
          <div className="neo-brutal-card bg-card p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header Section */}
            <div className="neo-brutal-header bg-primary text-primary-foreground p-6 relative overflow-hidden">
              <div className="absolute inset-0 neo-brutal-dots opacity-20" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="neo-brutal-icon-box bg-card text-foreground">
                  <LockKeyhole className="h-8 w-8" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight leading-none uppercase">
                    Redefinir
                  </h1>
                  <p className="text-xl font-bold opacity-80 uppercase">Sua Senha</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdatePasswordSubmit} className="p-6 space-y-6">
              <p className="text-muted-foreground font-medium text-center">
                Escolha uma senha forte para proteger sua conta.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" title="A senha deve ter 8+ caracteres, maiúsculas, minúsculas, números e símbolos." className="neo-brutal-label">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="neo-brutal-input pr-12"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(prev => !prev)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Checklist */}
                {password.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-muted/30 border-2 border-black dark:border-white/10 text-[10px] font-bold uppercase transition-all">
                    {[
                      { label: "8+ Caracteres", met: validatePassword(password).hasMinLength },
                      { label: "Letra Maiúscula", met: validatePassword(password).hasUpperCase },
                      { label: "Número", met: validatePassword(password).hasNumber },
                      { label: "Símbolo (!@#)", met: validatePassword(password).hasSpecialChar },
                    ].map((req, i) => (
                      <div key={i} className={cn("flex items-center gap-2", req.met ? "text-success" : "text-muted-foreground opacity-60")}>
                        {req.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {req.label}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="neo-brutal-label">Confirmar Senha</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita sua nova senha"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="neo-brutal-input"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="neo-brutal-button w-full"
                disabled={isLoading || !validatePassword(password).isValid || password !== confirmPassword}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Definir Senha e Entrar"
                )}
              </Button>
            </form>

            {/* Footer Pattern */}
            <div className="h-2 bg-gradient-to-r from-primary via-warning to-success" />
          </div>

          {/* Neo-Brutal Shadow */}
          <div className="absolute -bottom-3 -right-3 w-full h-full bg-foreground/10 dark:bg-foreground/5 -z-10" />
        </div>
      </div>
    </Layout>
  );
};

export default UpdatePasswordPage;