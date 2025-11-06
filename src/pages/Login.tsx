import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Computer, Lock, Mail, ArrowLeft, KeySquare, LockKeyhole, UserPlus, Eye, EyeOff, AlertCircle, User, LogIn, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type AuthMode = 'login' | 'register' | 'forgot_password' | 'update_password';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<AuthMode>('login');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 

  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, resetPassword, verifyEmail } = useAuth(); 

  // Efeito para verificar se o usuário está no fluxo de redefinição/convite
  useEffect(() => {
    const params = new URLSearchParams(location.hash.substring(1));
    const type = params.get('type');
    const accessToken = params.get('access_token');

    if (type === 'recovery' || type === 'invite') {
      if (accessToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: params.get('refresh_token')! })
          .then(({ data, error }) => {
            if (error) {
              console.error("Erro ao definir sessão com token:", error);
              toast({ title: "Erro de acesso", description: "Token inválido ou expirado.", variant: "destructive" });
              navigate('/login', { replace: true });
            } else if (data.session) {
              setCurrentMode('update_password');
              navigate(location.pathname, { replace: true });
            }
          });
      }
    }
  }, [location, navigate]);

  // --- Validação de E-mail em Tempo Real ---
  const isEmailValid = email.length > 0 && verifyEmail(email);
  const emailError = email.length > 0 && !isEmailValid ? "O email deve pertencer ao domínio institucional (@colegiosaojudas.com.br)." : null;
  
  // --- Handlers de Submissão ---

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isEmailValid) {
      toast({ title: "Erro de login", description: "Corrija o email institucional.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      toast({ title: "Login bem-sucedido", description: "Bem-vindo ao sistema!" });
      navigate("/");
    } else {
      toast({ title: "Erro de login", description: result.error || "Email ou senha incorretos", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({ title: "Erro de registro", description: "As senhas não coincidem.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!isEmailValid) {
      toast({ title: "Erro de registro", description: "Corrija o email institucional.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const result = await register(email, password);
    if (result.success) {
      toast({ title: "Registro bem-sucedido", description: "Verifique seu email para confirmar o cadastro." });
      setCurrentMode('login');
    } else {
      toast({ title: "Erro de registro", description: result.error || "Falha ao registrar. Verifique se o auto-registro está ativo no Supabase.", variant: "destructive" });
    }
    setIsLoading(false);
  };


  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isEmailValid) {
      toast({ title: "Erro", description: "Corrija o email institucional.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const result = await resetPassword(email);
    if (result.success) {
      toast({ title: "Email enviado", description: "Verifique sua caixa de entrada para definir sua senha." });
      setCurrentMode('login');
    } else {
      toast({ title: "Erro de envio", description: result.error || "Não foi possível enviar o email. Verifique o endereço.", variant: "destructive" });
    }
    setIsLoading(false);
  };

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
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      toast({ title: "Sucesso!", description: "Sua senha foi definida. Você está logado e será redirecionado." });
      
      navigate("/", { replace: true });
    } catch (error: any) {
      toast({ title: "Erro ao definir senha", description: error.message || "Não foi possível atualizar a senha. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para limpar campos ao mudar de modo
  const changeMode = (mode: AuthMode) => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setCurrentMode(mode);
  };

  // --- Renderização Condicional ---
  
  // NOVO RENDER HEADER MINIMALISTA
  const renderMinimalHeader = (title: string, description: string, Icon: React.ElementType) => (
    <CardHeader className="space-y-1 text-center pb-6 pt-8">
      <div className="flex justify-center mb-2">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <CardTitle className="text-3xl font-extrabold text-foreground">{title}</CardTitle>
      {description && <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>}
    </CardHeader>
  );

  const renderForm = () => {
    switch (currentMode) {
      case 'update_password':
        return (
          <form onSubmit={handleUpdatePasswordSubmit}>
            {renderMinimalHeader(
              "Definir Nova Senha",
              "Crie uma senha segura para acessar o sistema.",
              LockKeyhole
            )}
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-foreground flex items-center gap-1.5"><LockKeyhole className="h-4 w-4" />Nova Senha</Label>
                <div className="relative">
                  <Input id="new-password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} className="bg-input-bg border-input pr-10" disabled={isLoading} required />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(prev => !prev)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-foreground flex items-center gap-1.5"><LockKeyhole className="h-4 w-4" />Confirmar Senha</Label>
                <div className="relative">
                  <Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="Confirme sua nova senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-input-bg border-input pr-10" disabled={isLoading} required />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(prev => !prev)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-6">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Definir Senha e Entrar"}
              </Button>
            </CardFooter>
          </form>
        );

      case 'forgot_password':
        return (
          <form onSubmit={handleRecoverySubmit}>
            {renderMinimalHeader(
              "Recuperar Senha",
              "Digite seu e-mail institucional para receber o link de redefinição.",
              RotateCcw
            )}
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="recovery-email" className="text-foreground flex items-center gap-1.5"><Mail className="h-4 w-4" />Email Institucional</Label>
                <Input 
                  id="recovery-email" 
                  type="email" 
                  placeholder="seu.email@colegiosaojudas.com.br" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className={cn("bg-input-bg border-input", emailError && "border-destructive")} 
                  disabled={isLoading} 
                  required
                />
                {emailError && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{emailError}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pb-6">
              <Button type="submit" className="w-full" disabled={isLoading || !isEmailValid}>
                {isLoading ? "Enviando..." : "Enviar Link de Redefinição"}
              </Button>
              <Button type="button" variant="link" className="text-sm text-muted-foreground p-0 h-auto" onClick={() => changeMode('login')} disabled={isLoading}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Voltar ao login
              </Button>
            </CardFooter>
          </form>
        );

      case 'register':
        return (
          <form onSubmit={handleRegisterSubmit}>
            {renderMinimalHeader(
              "Novo Cadastro",
              "Crie sua conta usando seu email institucional.",
              UserPlus
            )}
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-foreground flex items-center gap-1.5"><Mail className="h-4 w-4" />Email Institucional</Label>
                <Input 
                  id="register-email" 
                  type="email" 
                  placeholder="seu.email@colegiosaojudas.com.br" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className={cn("bg-input-bg border-input", emailError && "border-destructive")} 
                  disabled={isLoading} 
                  required
                />
                {emailError && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{emailError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-foreground flex items-center gap-1.5"><Lock className="h-4 w-4" />Senha</Label>
                <div className="relative">
                  <Input id="register-password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} className="bg-input-bg border-input pr-10" disabled={isLoading} required />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(prev => !prev)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-confirm-password" className="text-foreground flex items-center gap-1.5"><Lock className="h-4 w-4" />Confirmar Senha</Label>
                <div className="relative">
                  <Input id="register-confirm-password" type={showPassword ? "text" : "password"} placeholder="Confirme sua senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-input-bg border-input pr-10" disabled={isLoading} required />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(prev => !prev)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pb-6">
              <Button type="submit" className="w-full" disabled={isLoading || !isEmailValid || password.length < 6 || password !== confirmPassword}>
                {isLoading ? "Registrando..." : <><UserPlus className="h-4 w-4 mr-2" />Cadastrar</>}
              </Button>
              <Button type="button" variant="link" className="text-sm text-muted-foreground p-0 h-auto" onClick={() => changeMode('login')} disabled={isLoading}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Voltar ao login
              </Button>
            </CardFooter>
          </form>
        );

      case 'login':
      default:
        return (
          <form onSubmit={handleLoginSubmit}>
            {renderMinimalHeader(
              "Zelote",
              "", // Removendo a descrição aqui
              Computer
            )}
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-foreground flex items-center gap-1.5"><Mail className="h-4 w-4" />Email Institucional</Label>
                <Input 
                  id="login-email" 
                  type="email" 
                  placeholder="seu.email@colegiosaojudas.com.br" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className={cn("bg-input-bg border-input", emailError && "border-destructive")} 
                  disabled={isLoading} 
                  required
                />
                {emailError && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{emailError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-foreground flex items-center gap-1.5"><Lock className="h-4 w-4" />Senha</Label>
                <div className="relative">
                  <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Digite sua senha" value={password} onChange={e => setPassword(e.target.value)} className="bg-input-bg border-input pr-10" disabled={isLoading} required />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(prev => !prev)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pb-6">
              <Button type="submit" className="w-full" disabled={isLoading || !isEmailValid}>
                {isLoading ? "Entrando..." : <><LogIn className="h-4 w-4 mr-2" />Entrar</>}
              </Button>
              <Button type="button" variant="link" className="text-sm text-muted-foreground p-0 h-auto" onClick={() => changeMode('forgot_password')} disabled={isLoading}>
                <KeySquare className="h-3.5 w-3.5 mr-1" />
                Esqueci minha senha
              </Button>
              <Button type="button" variant="link" className="text-sm text-primary p-0 h-auto" onClick={() => changeMode('register')} disabled={isLoading}>
                <User className="h-3.5 w-3.5 mr-1" />
                Cadastrar-se
              </Button>
            </CardFooter>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary p-4 transition-colors duration-500">
      <Card className="w-full max-w-md shadow-xl glass-card border-0 overflow-hidden">
        {renderForm()}
      </Card>
    </div>
  );
};

export default Login;