import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Computer, Lock, Mail, ArrowLeft, KeySquare, LockKeyhole, UserPlus, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstAccessOrRecoveryMode, setIsFirstAccessOrRecoveryMode] = useState(false); // Renomeado
  const [isUpdatePasswordMode, setUpdatePasswordMode] = useState(false); 

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 

  const navigate = useNavigate();
  const location = useLocation();
  const { login, resetPassword, verifyEmail } = useAuth(); 

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

    if (!verifyEmail(loginEmail)) {
      toast({
        title: "Erro de login",
        description: "O email deve pertencer ao domínio institucional.",
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
    
    if (!verifyEmail(recoveryEmail)) {
      toast({
        title: "Erro de acesso",
        description: "O email deve pertencer ao domínio institucional.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    const result = await resetPassword(recoveryEmail);
    if (result.success) {
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para definir sua senha."
      });
      // Mantém o email preenchido no campo de login ao voltar
      setLoginEmail(recoveryEmail); 
      setRecoveryEmail("");
      setIsFirstAccessOrRecoveryMode(false);
    } else {
      toast({
        title: "Erro de envio",
        description: result.error || "Não foi possível enviar o email. Verifique o endereço.",
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
  
  const handleToggleRecoveryMode = () => {
    setIsFirstAccessOrRecoveryMode(prev => {
      if (prev) {
        // Ao sair do modo de recuperação, preenche o email de login com o email de recuperação
        setLoginEmail(recoveryEmail);
        setRecoveryEmail('');
      } else {
        // Ao entrar no modo de recuperação, preenche o email de recuperação com o email de login
        setRecoveryEmail(loginEmail);
      }
      return !prev;
    });
  };

  // --- Renderização Condicional ---

  const renderContent = () => {
    if (isUpdatePasswordMode) {
      // MODO DE ATUALIZAÇÃO DE SENHA (PRIMEIRO ACESSO / REDEFINIÇÃO)
      return (
        <form onSubmit={handleUpdatePasswordSubmit}>
          <CardHeader className="space-y-1 text-center pb-6 bg-gradient-to-r from-green-500/10 to-green-600/10">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100 shadow-md">
                <UserPlus className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Definir Nova Senha</CardTitle>
            <CardDescription className="text-gray-600">
              Crie uma senha segura para acessar o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-gray-700 flex items-center gap-1.5"><LockKeyhole className="h-4 w-4" />Nova Senha</Label>
              <div className="relative">
                <Input id="new-password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-white/70 pr-10" disabled={isLoading} required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(prev => !prev)}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-gray-700 flex items-center gap-1.5"><LockKeyhole className="h-4 w-4" />Confirmar Senha</Label>
              <div className="relative">
                <Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="Confirme sua nova senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-white/70 pr-10" disabled={isLoading} required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(prev => !prev)}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
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

    if (isFirstAccessOrRecoveryMode) {
      // MODO DE PRIMEIRO ACESSO / RECUPERAÇÃO DE SENHA
      return (
        <form onSubmit={handleRecoverySubmit}>
          <CardHeader className="space-y-1 text-center pb-6 bg-gradient-to-r from-blue-500/10 to-blue-600/10">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 shadow-md">
                <KeySquare className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-blue-800">Primeiro Acesso / Recuperação</CardTitle>
            <CardDescription className="text-gray-600">
              Digite seu e-mail institucional para receber o link de acesso.
              <br/>
              (Use este modo se você foi convidado ou esqueceu sua senha.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="recovery-email" className="text-gray-700 flex items-center gap-1.5"><Mail className="h-4 w-4" />Email Institucional</Label>
              <Input id="recovery-email" type="email" placeholder="seu.email@colegiosaojudas.com.br" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} className="bg-white/70" disabled={isLoading} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-6">
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar Link de Acesso"}
            </Button>
            <Button type="button" variant="ghost" className="text-sm text-gray-600" onClick={handleToggleRecoveryMode} disabled={isLoading}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Voltar ao login
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
            <div className="relative">
              <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Digite sua senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="bg-white/70 pr-10" disabled={isLoading} />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(prev => !prev)}>
                {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pb-6">
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
          <Button type="button" variant="ghost" className="text-sm text-gray-600" onClick={handleToggleRecoveryMode} disabled={isLoading}>
            <KeySquare className="h-3.5 w-3.5 mr-1" />
            Primeiro Acesso / Recuperar Senha
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