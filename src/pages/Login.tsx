import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Computer, User, Lock, Mail, ArrowLeft, KeyRound, UserPlus, KeySquare, LockKeyhole } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Página de autenticação do sistema
 * Permite que os usuários façam login, se registrem ou recuperem senha
 */
const Login = () => {
  // === ESTADOS (STATES) ===
  // Estado para controlar a aba ativa (login, registro ou recuperação de senha)
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);

  // === LOGIN ===
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // === REGISTRO ===
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  // === RECUPERAÇÃO DE SENHA ===
  const [recoveryEmail, setRecoveryEmail] = useState("");

  // Hook para navegação entre rotas
  const navigate = useNavigate();

  // Hook para acessar o contexto de autenticação
  const {
    login,
    register,
    resetPassword,
    verifyEmail,
    loginWithGoogle
  } = useAuth();

  /**
   * Função que processa o envio do formulário de login
   * @param e - Evento de submit do formulário
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Verificação básica dos campos
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Erro de login",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Verifica se o email possui o domínio correto
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

    // Tenta fazer login
    const result = await login(loginEmail, loginPassword);
    if (result.success) {
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo ao sistema de controle de empréstimos e devoluções"
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

  /**
   * Função para login com Google
   */
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      // Nota: a navegação será tratada pelo listener no AuthContext
    } catch (error) {
      toast({
        title: "Erro de login",
        description: "Não foi possível fazer login com o Google",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  /**
   * Função que processa o envio do formulário de registro
   * @param e - Evento de submit do formulário
   */
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Verificação básica dos campos
    if (!registerEmail || !registerPassword || !registerConfirmPassword) {
      toast({
        title: "Erro de registro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Verifica se o email possui o domínio correto
    const domainRegex = /@colegiosaojudas\.com\.br$/i;
    if (!domainRegex.test(registerEmail)) {
      toast({
        title: "Erro de registro",
        description: "O email deve ter o domínio @colegiosaojudas.com.br",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Verifica se as senhas coincidem
    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: "Erro de registro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Tenta registrar o usuário
    const result = await register(registerEmail, registerPassword);
    if (result.success) {
      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada. Verifique seu email para confirmar o cadastro."
      });

      // Limpa os campos e volta para a aba de login
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
      setActiveTab("login");
    } else {
      toast({
        title: "Erro de registro",
        description: result.error || "Este email já está registrado ou é inválido",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  /**
   * Função que processa o envio do formulário de recuperação de senha
   * @param e - Evento de submit do formulário
   */
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Verificação básica dos campos
    if (!recoveryEmail) {
      toast({
        title: "Erro de recuperação",
        description: "Por favor, informe seu email",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Verifica se o email existe
    if (!verifyEmail(recoveryEmail)) {
      toast({
        title: "Erro de recuperação",
        description: "Este email não está registrado no sistema ou não tem o domínio correto",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Tenta redefinir a senha
    const result = await resetPassword(recoveryEmail);
    if (result.success) {
      toast({
        title: "Recuperação iniciada",
        description: "Enviamos um email com instruções para redefinir sua senha."
      });

      // Limpa os campos e volta para a aba de login
      setRecoveryEmail("");
      setActiveTab("login");
    } else {
      toast({
        title: "Erro de recuperação",
        description: result.error || "Não foi possível iniciar a recuperação de senha",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md">
        <Card className="w-full shadow-2xl border border-border/50 overflow-hidden backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-3 text-center pb-8 pt-10">
            <div className="flex justify-center mb-2">
              <div className="p-4 rounded-2xl bg-primary/10 shadow-sm ring-1 ring-primary/20">
                <Computer className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">Zelote</CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Sistema de gerenciamento de empréstimos
            </CardDescription>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mx-auto bg-muted/50 h-12">
              <TabsTrigger value="login" className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2 font-medium">
                <User className="h-4 w-4" />
                <span>Login</span>
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2 font-medium">
                <UserPlus className="h-4 w-4" />
                <span>Cadastro</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Aba de Login */}
            <TabsContent value="login" className="mt-0 fade-enter">
              <form onSubmit={handleLoginSubmit}>
                <CardContent className="space-y-5 pt-8 px-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-foreground font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Email Institucional
                    </Label>
                    <Input 
                      id="login-email" 
                      type="email" 
                      placeholder="seu.email@colegiosaojudas.com.br" 
                      value={loginEmail} 
                      onChange={e => setLoginEmail(e.target.value)} 
                      className="h-11 bg-background border-input focus:ring-2 focus:ring-primary/20 transition-all" 
                      disabled={isLoading} 
                    />
                    <p className="text-xs text-muted-foreground">
                      Use seu email institucional
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-foreground font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      Senha
                    </Label>
                    <Input 
                      id="login-password" 
                      type="password" 
                      placeholder="Digite sua senha" 
                      value={loginPassword} 
                      onChange={e => setLoginPassword(e.target.value)} 
                      className="h-11 bg-background border-input focus:ring-2 focus:ring-primary/20 transition-all" 
                      disabled={isLoading} 
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4 pb-8 px-6">
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                  
                  <div className="relative w-full text-center my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-3 text-sm text-muted-foreground">ou</span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="text-sm text-muted-foreground hover:text-primary hover:bg-primary/5" 
                    onClick={() => setActiveTab("recovery")} 
                    disabled={isLoading}
                  >
                    <KeySquare className="h-4 w-4 mr-2" />
                    Esqueceu sua senha?
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            {/* Aba de Registro */}
            <TabsContent value="register" className="mt-0 fade-enter">
              <form onSubmit={handleRegisterSubmit}>
                <CardContent className="space-y-5 pt-8 px-6">
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-foreground font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Email Institucional
                    </Label>
                    <Input 
                      id="register-email" 
                      type="email" 
                      placeholder="seu.email@colegiosaojudas.com.br" 
                      value={registerEmail} 
                      onChange={e => setRegisterEmail(e.target.value)} 
                      className="h-11 bg-background border-input focus:ring-2 focus:ring-primary/20 transition-all" 
                      disabled={isLoading} 
                    />
                    <p className="text-xs text-muted-foreground">
                      Use seu email institucional
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-foreground font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      Senha
                    </Label>
                    <Input 
                      id="register-password" 
                      type="password" 
                      placeholder="Crie uma senha forte" 
                      value={registerPassword} 
                      onChange={e => setRegisterPassword(e.target.value)} 
                      className="h-11 bg-background border-input focus:ring-2 focus:ring-primary/20 transition-all" 
                      disabled={isLoading} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="text-foreground font-medium flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-primary" />
                      Confirmar Senha
                    </Label>
                    <Input 
                      id="register-confirm-password" 
                      type="password" 
                      placeholder="Confirme sua senha" 
                      value={registerConfirmPassword} 
                      onChange={e => setRegisterConfirmPassword(e.target.value)} 
                      className="h-11 bg-background border-input focus:ring-2 focus:ring-primary/20 transition-all" 
                      disabled={isLoading} 
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="pb-8 px-6">
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            {/* Aba de Recuperação de Senha */}
            <TabsContent value="recovery" className="mt-0 fade-enter">
              <form onSubmit={handleRecoverySubmit}>
                <CardContent className="space-y-5 pt-8 px-6">
                  <div className="flex items-center mb-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-muted-foreground hover:text-primary p-0 h-auto -ml-2" 
                      onClick={() => setActiveTab("login")} 
                      disabled={isLoading}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar ao login
                    </Button>
                  </div>
                  
                  <div className="text-center mb-6">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 ring-1 ring-primary/20">
                      <LockKeyhole className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Recuperação de Senha</h3>
                    <p className="text-sm text-muted-foreground mt-1">Informe seu email para redefinir sua senha</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recovery-email" className="text-foreground font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Email Institucional
                    </Label>
                    <Input 
                      id="recovery-email" 
                      type="email" 
                      placeholder="seu.email@colegiosaojudas.com.br" 
                      value={recoveryEmail} 
                      onChange={e => setRecoveryEmail(e.target.value)} 
                      className="h-11 bg-background border-input focus:ring-2 focus:ring-primary/20 transition-all" 
                      disabled={isLoading} 
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="pb-8 px-6">
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Enviando..." : "Recuperar Senha"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>;
};
export default Login;