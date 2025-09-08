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
    const result = await resetPassword(recoveryEmail, "");
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
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#D3E4FD] to-[#F0F7FF] p-4">
      <div className="w-full max-w-md">
        <Card className="w-full shadow-xl glass-card border-0 overflow-hidden">
          <CardHeader className="space-y-1 text-center pb-6 bg-gradient-to-r from-blue-500/10 to-blue-600/10">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 shadow-md">
                <Computer className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-blue-800">Zelote</CardTitle>
            <CardDescription className="text-gray-600">
              Acesse o sistema para gerenciar empréstimos e devoluções
            </CardDescription>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-[90%] mx-auto bg-gray-100/60 mt-4">
              <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span>Login</span>
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 flex items-center gap-1">
                <UserPlus className="h-3.5 w-3.5" />
                <span>Cadastro</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Aba de Login */}
            <TabsContent value="login" className="mt-0 fade-enter">
              <form onSubmit={handleLoginSubmit}>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-gray-700 flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      Email Institucional
                    </Label>
                    <div className="relative">
                      <Input id="login-email" type="email" placeholder="seu.email@colegiosaojudas.com.br" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="bg-white/70 border-gray-200 focus:border-blue-300 transition-all pl-3" disabled={isLoading} />
                    </div>
                    <p className="text-xs text-gray-500 italic">
                      Use seu email institucional com o domínio @colegiosaojudas.com.br
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-700 flex items-center gap-1.5">
                      <Lock className="h-4 w-4" />
                      Senha
                    </Label>
                    <div className="relative">
                      <Input id="login-password" type="password" placeholder="Digite sua senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="bg-white/70 border-gray-200 focus:border-blue-300 transition-all pl-3" disabled={isLoading} />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4 pb-6">
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all shadow-md" disabled={isLoading}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                  
                  <div className="relative w-full text-center my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-2 text-sm text-gray-500">ou</span>
                    </div>
                  </div>
                  
                  
                  
                  <Button type="button" variant="ghost" className="text-sm text-gray-600 hover:text-blue-700 mt-2" onClick={() => setActiveTab("recovery")} disabled={isLoading}>
                    <KeySquare className="h-3.5 w-3.5 mr-1" />
                    Esqueceu sua senha?
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            {/* Aba de Registro */}
            <TabsContent value="register" className="mt-0 fade-enter">
              <form onSubmit={handleRegisterSubmit}>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-gray-700 flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      Email Institucional
                    </Label>
                    <div className="relative">
                      <Input id="register-email" type="email" placeholder="seu.email@colegiosaojudas.com.br" value={registerEmail} onChange={e => setRegisterEmail(e.target.value)} className="bg-white/70 border-gray-200 focus:border-blue-300 transition-all pl-3" disabled={isLoading} />
                    </div>
                    <p className="text-xs text-gray-500 italic">
                      Use seu email institucional com o domínio @colegiosaojudas.com.br
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-gray-700 flex items-center gap-1.5">
                      <Lock className="h-4 w-4" />
                      Senha
                    </Label>
                    <div className="relative">
                      <Input id="register-password" type="password" placeholder="Crie uma senha forte" value={registerPassword} onChange={e => setRegisterPassword(e.target.value)} className="bg-white/70 border-gray-200 focus:border-blue-300 transition-all pl-3" disabled={isLoading} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="text-gray-700 flex items-center gap-1.5">
                      <KeyRound className="h-4 w-4" />
                      Confirmar Senha
                    </Label>
                    <div className="relative">
                      <Input id="register-confirm-password" type="password" placeholder="Confirme sua senha" value={registerConfirmPassword} onChange={e => setRegisterConfirmPassword(e.target.value)} className="bg-white/70 border-gray-200 focus:border-blue-300 transition-all pl-3" disabled={isLoading} />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="pb-6">
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all shadow-md" disabled={isLoading}>
                    {isLoading ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            {/* Aba de Recuperação de Senha */}
            <TabsContent value="recovery" className="mt-0 fade-enter">
              <form onSubmit={handleRecoverySubmit}>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center mb-4">
                    <Button type="button" variant="ghost" className="text-gray-600 p-0 h-auto" onClick={() => setActiveTab("login")} disabled={isLoading}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar ao login
                    </Button>
                  </div>
                  
                  <div className="text-center mb-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                      <LockKeyhole className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Recuperação de Senha</h3>
                    <p className="text-sm text-gray-600">Informe seu email para redefinir sua senha</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recovery-email" className="text-gray-700 flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      Email Institucional
                    </Label>
                    <div className="relative">
                      <Input id="recovery-email" type="email" placeholder="seu.email@colegiosaojudas.com.br" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} className="bg-white/70 border-gray-200 focus:border-blue-300 transition-all pl-3" disabled={isLoading} />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="pb-6">
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all shadow-md" disabled={isLoading}>
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