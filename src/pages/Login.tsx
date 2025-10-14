import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Computer, Lock, Mail, ArrowLeft, KeySquare, LockKeyhole, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveryMode, setRecoveryMode] = useState(false);
  const [isUpdatePasswordMode, setUpdatePasswordMode] = useState(false); // Novo estado para primeiro acesso/redefinição

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { login, resetPassword } = useAuth();

  // Efeito para verificar se o usuário está no fluxo de redefinição/convite
  useEffect(() => {
    const params = new URLSearchParams(location.hash.substring(1));
    const type = params.get('type');
    const accessToken = params.get('access_token');

    if (type === 'recovery' || type === 'invite') {
      if (accessToken) {
        // Tenta definir a sessão com o token da URL
        supabase.auth.setSession({ access_token: accessToken, refresh_token: params.get('refresh_token')! })
          .then(({ data, error }) => {
            if (error) {
              console.error("Erro ao definir sessão com token:", error);
              toast({ title: "Erro de acesso", description: "Token inválido ou expirado.", variant: "destructive" });
              navigate('/login', { replace: true });
            } else if (data.session) {
              // Se a sessão for definida, entra no modo de atualização de senha
              setUpdatePasswordMode(true);
              // Limpa o hash da URL para evitar loops
              navigate(location.pathname, { replace: true });
            }
          });
      }
    }
  }, [location, navigate]);


  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const domainRegex = /@colegiosaojudas\.com\.br$/i;
    if (!domainRegex.test(loginEmail)) {
      toast({
        title: "Erro de login",
        description: "O email deve ter o domínio @colegiosaojudas.com.br",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    const result = await login(loginEmail, loginPassword);
    if (result.success) {
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo ao sistema!"
      });
      navigate("/");
    } else {
      toast({
        title: "Erro de login",
        description: result.error || "Email ou senha incorretos",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!recoveryEmail) {
      toast({ title: "Erro", description: "Por favor, informe seu email", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const result = await resetPassword(recoveryEmail);
    if (result.success) {
      toast({
        title: "Recuperação iniciada",
        description: "Enviamos um email com instruções para redefinir sua senha."
      });
      setRecoveryEmail("");
      setRecoveryMode(false);
    } else {
      toast({
        title: "Erro de recuperação",
        description: result.error || "Não foi possível iniciar a recuperação de senha",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Sua senha foi definida. Você está logado e será redirecionado.",
      });
      
      // Redireciona para a página principal (o AuthProvider deve pegar a sessão)
      navigate("/", { replace: true });
    } catch (error: any) {
      toast({
        title: "Erro ao definir senha",
        description: error.message || "Não foi possível atualizar a senha. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Renderização Condicional ---

  const renderContent = () => {
    if (isUpdatePasswordMode) {
      // MODO DE ATUALIZAÇÃO DE SENHA (PRIMEIRO ACESSO)
      return (
        <form onSubmit={handleUpdatePasswordSubmit}>
          <CardHeader className="space-y-1 text-center pb-6 bg-gradient-to-r from-green-500/10 to-green-600/10">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100 shadow-md">
                <UserPlus className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Primeiro Acesso</CardTitle>
            <CardDescription className="text-gray-600">
              Defina sua nova senha para acessar o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-gray-700 flex items-center gap-1.5"><LockKeyhole className="h-4 w-4" />Nova Senha</Label>
              <Input id="new-password" type="password" placeholder="Mínimo 6 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-white/70" disabled={isLoading} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-gray-700 flex items-center gap-1.5"><LockKeyhole className="h-4 w-4" />Confirmar Senha</Label>
              <Input id="confirm-password" type="password" placeholder="Confirme sua nova senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-white/70" disabled={isLoading} required />
            </div>
          </CardContent>
          <CardFooter className="pb-6">
            <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-green-500" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Definir Senha e Entrar"}
            </Button>
          </CardFooter>
        </form>
      );
    }

    if (isRecoveryMode) {
      // MODO DE RECUPERAÇÃO DE SENHA
      return (
        <form onSubmit={handleRecoverySubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center mb-4">
              <Button type="button" variant="ghost" className="text-gray-600 p-0 h-auto" onClick={() => setRecoveryMode(false)} disabled={isLoading}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao login
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recovery-email" className="text-gray-700 flex items-center gap-1.5"><Mail className="h-4 w-4" />Email Institucional</Label>
              <Input id="recovery-email" type="email" placeholder="seu.email@colegiosaojudas.com.br" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} className="bg-white/70" disabled={isLoading} />
            </div>
          </CardContent>
          <CardFooter className="pb-6">
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Recuperar Senha"}
            </Button>
          </CardFooter>
        </form>
      );
    }

    // MODO DE LOGIN PADRÃO
    return (
      <form onSubmit={handleLoginSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-gray-700 flex items-center gap-1.5"><Mail className="h-4 w-4" />Email Institucional</Label>
            <Input id="login-email" type="email" placeholder="seu.email@colegiosaojudas.com.br" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="bg-white/70" disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password" className="text-gray-700 flex items-center gap-1.5"><Lock className="h-4 w-4" />Senha</Label>
            <Input id="login-password" type="password" placeholder="Digite sua senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="bg-white/70" disabled={isLoading} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pb-6">
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
          <Button type="button" variant="ghost" className="text-sm text-gray-600" onClick={() => setRecoveryMode(true)} disabled={isLoading}>
            <KeySquare className="h-3.5 w-3.5 mr-1" />
            Esqueceu sua senha?
          </Button>
        </CardFooter>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#D3E4FD] to-[#F0F7FF] p-4">
      <Card className="w-full max-w-md shadow-xl glass-card border-0 overflow-hidden">
        {/* O cabeçalho é renderizado apenas se não estiver no modo de atualização de senha, pois ele tem seu próprio cabeçalho */}
        {!isUpdatePasswordMode && (
          <CardHeader className="space-y-1 text-center pb-6 bg-gradient-to-r from-blue-500/10 to-blue-600/10">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 shadow-md">
                <Computer className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-blue-800">Zelote</CardTitle>
            <CardDescription className="text-gray-600">
              Acesso restrito para usuários convidados
            </CardDescription>
          </CardHeader>
        )}
        
        {renderContent()}
      </Card>
    </div>
  );
};

export default Login;