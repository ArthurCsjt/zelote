import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { validatePassword } from "@/utils/passwordValidation";
import { Computer, ArrowLeft, UserPlus, Eye, EyeOff, AlertCircle, LogIn, RotateCcw, Loader2, Check, X, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { LoginSchedulingShowcase } from "@/components/auth/LoginSchedulingShowcase";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = 'login' | 'register' | 'forgot_password';

/**
 * Traduz erros técnicos do Supabase / Auth para mensagens claras e amigáveis ao usuário final.
 */
const translateAuthError = (rawError: string | null | undefined): { message: string; isUnconfirmed?: boolean } => {
  if (!rawError) {
    return { message: "Ocorreu um erro inesperado. Tente novamente." };
  }

  const err = rawError.toLowerCase();

  if (err.includes("email not confirmed") || err.includes("not confirmed")) {
    return {
      message: "Seu e-mail institucional ainda não foi confirmado. Verifique sua caixa de entrada (ou spam) para ativar a conta.",
      isUnconfirmed: true,
    };
  }

  if (err.includes("invalid login credentials") || err.includes("invalid_grant") || err.includes("invalid credentials")) {
    return { message: "E-mail ou senha incorretos. Verifique os dados digitados." };
  }

  if (err.includes("user already registered") || err.includes("already registered") || err.includes("email already in use")) {
    return { message: "Este e-mail já possui cadastro. Tente fazer login ou recuperar sua senha." };
  }

  if (err.includes("too many requests") || err.includes("rate limit") || err.includes("over_email_send_rate_limit")) {
    return { message: "Muitas tentativas seguidas. Por segurança, aguarde alguns instantes antes de tentar novamente." };
  }

  if (err.includes("failed to fetch") || err.includes("network") || err.includes("connection")) {
    return { message: "Falha de conexão com a internet. Verifique sua rede e tente novamente." };
  }

  if (err.includes("password should be at least")) {
    return { message: "A senha deve conter no mínimo 8 caracteres." };
  }

  if (rawError.startsWith("Contas de alunos") || rawError.startsWith("O registro é permitido apenas")) {
    return { message: rawError };
  }

  return { message: "Não foi possível completar a solicitação no momento. Tente novamente mais tarde." };
};

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<AuthMode>('login');

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [showUnconfirmedAlert, setShowUnconfirmedAlert] = useState(false);

  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, resetPassword, verifyEmail } = useAuth();

  // Exibe erro de domínio após redirecionamento OAuth (Google com email não-institucional)
  useEffect(() => {
    const oauthError = localStorage.getItem('zelote_oauth_error');
    if (oauthError) {
      localStorage.removeItem('zelote_oauth_error');
      toast({ title: 'Acesso negado', description: oauthError, variant: 'destructive' });
    }
  }, []);

  const isEmailValid = email.length > 0 && verifyEmail(email);
  // Mensagem curta e acionável, exibida apenas quando o usuário sai do campo ou tenta submeter
  const emailError = emailTouched && email.length > 0 && !isEmailValid
    ? "Use seu e-mail @colegiosaojudas.com.br ou @sj.pro.br"
    : null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setShowUnconfirmedAlert(false);

    if (!email.trim()) {
      toast({ title: "Campo obrigatório", description: "Digite seu e-mail institucional.", variant: "destructive" });
      return;
    }

    if (!isEmailValid) {
      toast({
        title: "E-mail institucional obrigatório",
        description: "Use seu e-mail @colegiosaojudas.com.br ou @sj.pro.br para entrar.",
        variant: "destructive"
      });
      return;
    }

    if (!password) {
      toast({ title: "Campo obrigatório", description: "Digite sua senha para entrar.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    if (result.success) {
      toast({ title: "Login bem-sucedido", description: "Bem-vindo ao sistema!" });
      navigate("/");
    } else {
      const translated = translateAuthError(result.error);
      if (translated.isUnconfirmed) {
        setShowUnconfirmedAlert(true);
      }
      toast({ title: "Erro de login", description: translated.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setShowUnconfirmedAlert(false);

    if (!email.trim() || !isEmailValid) {
      toast({
        title: "E-mail institucional obrigatório",
        description: "Use seu e-mail @colegiosaojudas.com.br ou @sj.pro.br para se cadastrar.",
        variant: "destructive"
      });
      return;
    }

    if (firstName.trim().length === 0) {
      toast({ title: "Campo obrigatório", description: "Por favor, informe seu nome.", variant: "destructive" });
      return;
    }

    const passwordStatus = validatePassword(password);
    if (!passwordStatus.isValid) {
      toast({
        title: "Requisitos de senha",
        description: "A senha deve ter pelo menos 8 caracteres, letras maiúsculas e minúsculas, números e símbolos.",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Senhas divergentes", description: "A confirmação de senha não confere com a senha digitada.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const result = await register(email, password, firstName, lastName);
    if (result.success) {
      toast({
        title: "Cadastro realizado!",
        description: "Enviamos um link de confirmação para o seu e-mail. Ative sua conta antes do primeiro login."
      });
      setCurrentMode('login');
      setShowUnconfirmedAlert(true);
    } else {
      const translated = translateAuthError(result.error);
      toast({ title: "Não foi possível cadastrar", description: translated.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);

    if (!email.trim() || !isEmailValid) {
      toast({
        title: "E-mail institucional obrigatório",
        description: "Use seu e-mail @colegiosaojudas.com.br ou @sj.pro.br para recuperar sua senha.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const result = await resetPassword(email);
    if (result.success) {
      toast({ title: "E-mail enviado", description: "Verifique sua caixa de entrada para redefinir sua senha." });
      setCurrentMode('login');
    } else {
      const translated = translateAuthError(result.error);
      toast({ title: "Erro de envio", description: translated.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (!isEmailValid) {
      toast({ title: "E-mail inválido", description: "Informe seu e-mail institucional para reenviar a confirmação.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (error) {
        const translated = translateAuthError(error.message);
        toast({ title: "Falha ao reenviar", description: translated.message, variant: "destructive" });
      } else {
        toast({ title: "E-mail reenviado com sucesso!", description: "Verifique sua caixa de entrada e a pasta de spam/lixo eletrônico." });
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Não foi possível reenviar agora. Tente em instantes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const changeMode = useCallback((mode: AuthMode) => {
    // Mantém o e-mail digitado ao trocar de modo para evitar retrabalho
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setShowPassword(false);
    setEmailTouched(false);
    setShowUnconfirmedAlert(false);
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
  const passwordStatus = validatePassword(password);
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-y-auto bg-background">
      {/* Neo-Brutalist Background Pattern */}
      <div className="absolute inset-0 neo-brutal-grid opacity-[0.03] dark:opacity-[0.05]" />

      {/* Floating Geometric Shapes (Posicionadas estrategicamente com z-0 atrás dos cards) */}
      <div className="absolute top-4 left-4 w-20 h-20 bg-primary rotate-12 neo-brutal-shadow animate-float pointer-events-none z-0 opacity-70" />
      <div className="absolute bottom-12 right-8 w-16 h-16 bg-warning rotate-45 neo-brutal-shadow animate-float-delayed pointer-events-none z-0 opacity-70" />
      <div className="absolute top-8 right-12 w-12 h-12 bg-success rotate-6 neo-brutal-shadow animate-float pointer-events-none z-0 opacity-70" />
      <div className="absolute bottom-8 left-12 w-14 h-14 bg-error -rotate-12 neo-brutal-shadow animate-float-delayed pointer-events-none z-0 opacity-70" />

      {/* Container Principal Split-Screen Responsivo */}
      <div className="w-full max-w-7xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto">
        {/* Coluna Esquerda: Showcase do Agendamento (Visível em Telas Médias/Grandes) */}
        <div className="hidden lg:block lg:col-span-7">
          <LoginSchedulingShowcase />
        </div>

        {/* Coluna Direita: Card de Login Original 100% Preservado */}
        <div className="w-full max-w-md mx-auto lg:col-span-5 relative">
          {/* Neo-Brutal Card */}
          <div className="neo-brutal-card bg-card p-0 overflow-hidden">
            {/* Header Section */}
            <div className="neo-brutal-header bg-primary text-primary-foreground p-3 relative overflow-hidden">
              {/* Header Pattern */}
              <div className="absolute inset-0 neo-brutal-dots opacity-20" />

              <div className="relative z-10 flex items-center gap-3">
                <div className="neo-brutal-icon-box bg-card text-foreground">
                  <config.Icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight leading-none">
                    {config.title}
                  </h1>
                  <p className="text-base font-bold opacity-80">{config.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-4 pt-4">
              <p className="text-muted-foreground font-medium mb-3 text-center text-sm">
                {config.description}
              </p>

              {currentMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  {showUnconfirmedAlert && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-2 border-black dark:border-white/20 text-xs font-bold space-y-2 rounded-none">
                      <p className="text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        Confirmação pendente. Verifique seu e-mail institucional.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-black uppercase border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] bg-white dark:bg-zinc-800 flex items-center justify-center gap-1.5"
                        onClick={handleResendConfirmation}
                        disabled={isLoading}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Reenviar e-mail de confirmação
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="neo-brutal-label">Email Institucional</Label>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      autoFocus
                      placeholder="seu.email@colegiosaojudas.com.br ou @sj.pro.br"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      className={cn("neo-brutal-input", emailError && "border-error")}
                      disabled={isLoading}
                      required
                    />
                    {emailError && (
                      <p className="text-xs text-error flex items-center gap-1 font-medium">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{emailError}</span>
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
                        autoComplete="current-password"
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
                    disabled={isLoading}
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

                  {/* Divisor "ou" */}
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">ou</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Botão Entrar com Google */}
                  <GoogleLoginButton isLoading={isLoading} />

                  <div className="text-center pt-1">
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
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="neo-brutal-label">Email Institucional</Label>
                    <Input
                      id="register-email"
                      type="email"
                      autoComplete="username"
                      autoFocus
                      placeholder="seu.email@colegiosaojudas.com.br ou @sj.pro.br"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      className={cn("neo-brutal-input", emailError && "border-error")}
                      disabled={isLoading}
                      required
                    />
                    {emailError && (
                      <p className="text-xs text-error flex items-center gap-1 font-medium">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{emailError}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name" className="neo-brutal-label">Nome</Label>
                      <Input
                        id="first-name"
                        type="text"
                        autoComplete="given-name"
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
                        autoComplete="family-name"
                        placeholder="Ex: Silva"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="neo-brutal-input"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="register-password" title="A senha deve ter 8+ caracteres, maiúsculas, minúsculas, números e símbolos." className="neo-brutal-label">Senha</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Sua senha segura"
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

                    {/* Password Strength Checklist Completo */}
                    {password.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-muted/30 border-2 border-black dark:border-white/10 text-[10px] font-bold">
                        {[
                          { label: "8+ Caracteres", met: passwordStatus.hasMinLength },
                          { label: "Letra Maiúscula", met: passwordStatus.hasUpperCase },
                          { label: "Letra Minúscula", met: passwordStatus.hasLowerCase },
                          { label: "Número", met: passwordStatus.hasNumber },
                          { label: "Símbolo (!@#)", met: passwordStatus.hasSpecialChar },
                        ].map((req, i) => (
                          <div key={i} className={cn("flex items-center gap-1.5", req.met ? "text-success" : "text-muted-foreground opacity-60")}>
                            {req.met ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <X className="h-3.5 w-3.5" />}
                            <span>{req.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm" className="neo-brutal-label">Confirmar Senha</Label>
                    <Input
                      id="register-confirm"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Confirme sua senha"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={cn(
                        "neo-brutal-input",
                        passwordsMatch && "border-success",
                        passwordsMismatch && "border-error"
                      )}
                      disabled={isLoading}
                      required
                    />
                    {confirmPassword.length > 0 && (
                      <p className={cn(
                        "text-xs flex items-center gap-1 font-bold",
                        passwordsMatch ? "text-success" : "text-error"
                      )}>
                        {passwordsMatch ? (
                          <>
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                            As senhas coincidem
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3.5 w-3.5" />
                            As senhas não coincidem
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="neo-brutal-button w-full"
                    disabled={isLoading}
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
                      autoComplete="username"
                      autoFocus
                      placeholder="seu.email@colegiosaojudas.com.br ou @sj.pro.br"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      className={cn("neo-brutal-input", emailError && "border-error")}
                      disabled={isLoading}
                      required
                    />
                    {emailError && (
                      <p className="text-xs text-error flex items-center gap-1 font-medium">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{emailError}</span>
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="neo-brutal-button w-full"
                    disabled={isLoading}
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
    </div>
  );
};

export default Login;
