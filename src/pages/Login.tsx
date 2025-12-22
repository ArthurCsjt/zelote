import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Computer, ArrowLeft, UserPlus, Eye, EyeOff, AlertCircle, LogIn, RotateCcw, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type AuthMode = 'login' | 'register' | 'forgot_password';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<AuthMode>('login');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, resetPassword, verifyEmail } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.hash.substring(1));
    const type = params.get('type');
    const accessToken = params.get('access_token');

    if (type === 'recovery' || type === 'invite') {
      if (accessToken) {
        navigate(`/update-password${location.hash}`, { replace: true });
      }
    }
  }, [location, navigate]);

  const isEmailValid = email.length > 0 && verifyEmail(email);
  const emailError = email.length > 0 && !isEmailValid ? "O email deve pertencer a um domínio institucional permitido (@colegiosaojudas.com.br ou @sj.pro.br)." : null;

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
    if (firstName.trim().length === 0) {
      toast({ title: "Erro de registro", description: "O nome é obrigatório.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!isEmailValid) {
      toast({ title: "Erro de registro", description: "Corrija o email institucional.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const result = await register(email, password, firstName, lastName);
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

  const changeMode = useCallback((mode: AuthMode) => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setShowPassword(false);
    setCurrentMode(mode);
  }, []);

  const getModeConfig = () => {
    switch (currentMode) {
      case 'forgot_password':
        return { title: 'Recuperar', subtitle: 'Senha', description: 'Digite seu e-mail institucional', Icon: RotateCcw };
      case 'register':
        return { title: 'Criar', subtitle: 'Conta', description: 'Use seu email institucional', Icon: UserPlus };
      default:
        return { title: 'Zelote', subtitle: 'Sistema', description: 'Entre com suas credenciais', Icon: Computer };
    }
  };

  const config = getModeConfig();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Neo-Brutalist Background Pattern */}
      <div className="absolute inset-0 neo-brutal-grid opacity-[0.03] dark:opacity-[0.05]" />

      {/* Floating Geometric Shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary rotate-12 neo-brutal-shadow animate-float" />
      <div className="absolute bottom-32 right-16 w-16 h-16 bg-warning rotate-45 neo-brutal-shadow animate-float-delayed" />
      <div className="absolute top-1/3 right-20 w-12 h-12 bg-success rotate-6 neo-brutal-shadow animate-float" />
      <div className="absolute bottom-20 left-24 w-14 h-14 bg-error -rotate-12 neo-brutal-shadow animate-float-delayed" />

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Neo-Brutal Card */}
        <div className="neo-brutal-card bg-card p-0 overflow-hidden">
          {/* Header Section */}
          <div className="neo-brutal-header bg-primary text-primary-foreground p-6 relative overflow-hidden">
            {/* Header Pattern */}
            <div className="absolute inset-0 neo-brutal-dots opacity-20" />

            <div className="relative z-10 flex items-center gap-4">
              <div className="neo-brutal-icon-box bg-card text-foreground">
                <config.Icon className="h-8 w-8" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight leading-none">
                  {config.title}
                </h1>
                <p className="text-2xl font-bold opacity-80">{config.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-6 pt-8">
            <p className="text-muted-foreground font-medium mb-6 text-center">
              {config.description}
            </p>

            {currentMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="neo-brutal-label">Email Institucional</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu.email@colegiosaojudas.com.br ou @sj.pro.br"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={cn("neo-brutal-input", emailError && "border-error")}
                    disabled={isLoading}
                    required
                  />
                  {emailError && (
                    <p className="text-xs text-error flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3 w-3" />{emailError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="login-password" className="neo-brutal-label">Senha</Label>
                    <button
                      type="button"
                      className="text-xs font-bold text-primary hover:underline underline-offset-4"
                      onClick={() => changeMode('forgot_password')}
                      disabled={isLoading}
                    >
                      Esqueceu?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
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

                <Button
                  type="submit"
                  className="neo-brutal-button w-full"
                  disabled={isLoading || !isEmailValid}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-2" strokeWidth={2.5} />
                      Entrar
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <span className="text-muted-foreground">Não tem conta? </span>
                  <button
                    type="button"
                    className="font-bold text-primary hover:underline underline-offset-4"
                    onClick={() => changeMode('register')}
                    disabled={isLoading}
                  >
                    Cadastre-se
                  </button>
                </div>
              </form>
            )}

            {currentMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="neo-brutal-label">Email Institucional</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu.email@colegiosaojudas.com.br ou @sj.pro.br"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={cn("neo-brutal-input", emailError && "border-error")}
                    disabled={isLoading}
                    required
                  />
                  {emailError && (
                    <p className="text-xs text-error flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3 w-3" />{emailError}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name" className="neo-brutal-label">Nome</Label>
                    <Input
                      id="first-name"
                      type="text"
                      placeholder="Ex: José"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="neo-brutal-input"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name" className="neo-brutal-label">Sobrenome</Label>
                    <Input
                      id="last-name"
                      type="text"
                      placeholder="Ex: Silva"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="neo-brutal-input"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="neo-brutal-label">Senha</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
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

                <div className="space-y-2">
                  <Label htmlFor="register-confirm" className="neo-brutal-label">Confirmar Senha</Label>
                  <Input
                    id="register-confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="neo-brutal-input"
                    disabled={isLoading}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="neo-brutal-button w-full"
                  disabled={isLoading || !isEmailValid || password.length < 6 || password !== confirmPassword}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" strokeWidth={2.5} />
                      Cadastrar
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground font-bold transition-colors py-2"
                  onClick={() => changeMode('login')}
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </button>
              </form>
            )}

            {currentMode === 'forgot_password' && (
              <form onSubmit={handleRecoverySubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="recovery-email" className="neo-brutal-label">Email Institucional</Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="seu.email@colegiosaojudas.com.br ou @sj.pro.br"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={cn("neo-brutal-input", emailError && "border-error")}
                    disabled={isLoading}
                    required
                  />
                  {emailError && (
                    <p className="text-xs text-error flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3 w-3" />{emailError}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="neo-brutal-button w-full"
                  disabled={isLoading || !isEmailValid}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Enviar Link"
                  )}
                </Button>

                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground font-bold transition-colors py-2"
                  onClick={() => changeMode('login')}
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </button>
              </form>
            )}
          </div>

          {/* Footer Accent */}
          <div className="h-2 bg-gradient-to-r from-primary via-warning to-success" />
        </div>

        {/* Decorative Shadow Element */}
        <div className="absolute -bottom-3 -right-3 w-full h-full bg-foreground/10 dark:bg-foreground/5 -z-10 rounded-none" />
      </div>
    </div>
  );
};

export default Login;