
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Computer, User, Lock, Mail, ArrowLeft } from "lucide-react";
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
  
  // === LOGIN ===
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // === REGISTRO ===
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  
  // === RECUPERAÇÃO DE SENHA ===
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryNewPassword, setRecoveryNewPassword] = useState("");
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState("");
  
  // Hook para navegação entre rotas
  const navigate = useNavigate();
  
  // Hook para acessar o contexto de autenticação
  const { login, register, resetPassword, verifyEmail } = useAuth();

  /**
   * Função que processa o envio do formulário de login
   * @param e - Evento de submit do formulário
   */
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificação básica dos campos
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Erro de login",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    // Verifica se o email possui o domínio correto
    const domainRegex = /@colegiosaojudas\.com\.br$/i;
    if (!domainRegex.test(loginEmail)) {
      toast({
        title: "Erro de login",
        description: "O email deve ter o domínio @colegiosaojudas.com.br",
        variant: "destructive",
      });
      return;
    }

    // Extrai o nome de usuário do email (parte antes do @)
    const username = loginEmail.split('@')[0];

    // Tenta fazer login
    if (login(username, loginEmail, loginPassword)) {
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo ao sistema de gestão de Chromebooks",
      });
      navigate("/");
    } else {
      toast({
        title: "Erro de login",
        description: "Email ou senha incorretos",
        variant: "destructive",
      });
    }
  };

  /**
   * Função que processa o envio do formulário de registro
   * @param e - Evento de submit do formulário
   */
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificação básica dos campos
    if (!registerEmail || !registerPassword || !registerConfirmPassword) {
      toast({
        title: "Erro de registro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    // Verifica se o email possui o domínio correto
    const domainRegex = /@colegiosaojudas\.com\.br$/i;
    if (!domainRegex.test(registerEmail)) {
      toast({
        title: "Erro de registro",
        description: "O email deve ter o domínio @colegiosaojudas.com.br",
        variant: "destructive",
      });
      return;
    }

    // Verifica se as senhas coincidem
    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: "Erro de registro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    // Extrai o nome de usuário do email (parte antes do @)
    const username = registerEmail.split('@')[0];

    // Tenta registrar o usuário
    if (register(username, registerEmail, registerPassword)) {
      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada. Agora você pode fazer login.",
      });
      
      // Limpa os campos e volta para a aba de login
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
      setActiveTab("login");
    } else {
      toast({
        title: "Erro de registro",
        description: "Este email já está registrado ou é inválido",
        variant: "destructive",
      });
    }
  };

  /**
   * Função que processa o envio do formulário de recuperação de senha
   * @param e - Evento de submit do formulário
   */
  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificação básica dos campos
    if (!recoveryEmail || !recoveryNewPassword || !recoveryConfirmPassword) {
      toast({
        title: "Erro de recuperação",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    // Verifica se o email existe
    if (!verifyEmail(recoveryEmail)) {
      toast({
        title: "Erro de recuperação",
        description: "Este email não está registrado no sistema",
        variant: "destructive",
      });
      return;
    }

    // Verifica se as senhas coincidem
    if (recoveryNewPassword !== recoveryConfirmPassword) {
      toast({
        title: "Erro de recuperação",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    // Tenta redefinir a senha
    if (resetPassword(recoveryEmail, recoveryNewPassword)) {
      toast({
        title: "Senha redefinida",
        description: "Sua senha foi atualizada com sucesso. Agora você pode fazer login.",
      });
      
      // Limpa os campos e volta para a aba de login
      setRecoveryEmail("");
      setRecoveryNewPassword("");
      setRecoveryConfirmPassword("");
      setActiveTab("login");
    } else {
      toast({
        title: "Erro de recuperação",
        description: "Não foi possível redefinir sua senha",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md shadow-lg glass-card">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Computer className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Sistema de Gestão de Chromebooks</CardTitle>
          <CardDescription>
            Acesse o sistema para gerenciar empréstimos e devoluções
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-[90%] mx-auto">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Cadastro</TabsTrigger>
            <TabsTrigger value="recovery">Recuperar</TabsTrigger>
          </TabsList>
          
          {/* Aba de Login */}
          <TabsContent value="login">
            <form onSubmit={handleLoginSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Institucional</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu.email@colegiosaojudas.com.br"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Use seu email institucional com o domínio @colegiosaojudas.com.br
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          {/* Aba de Registro */}
          <TabsContent value="register">
            <form onSubmit={handleRegisterSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email Institucional</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu.email@colegiosaojudas.com.br"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Use seu email institucional com o domínio @colegiosaojudas.com.br
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Crie uma senha forte"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="Confirme sua senha"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button type="submit" className="w-full">
                  Cadastrar
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          {/* Aba de Recuperação de Senha */}
          <TabsContent value="recovery">
            <form onSubmit={handleRecoverySubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="recovery-email">Email Institucional</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="recovery-email"
                      type="email"
                      placeholder="seu.email@colegiosaojudas.com.br"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recovery-new-password">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="recovery-new-password"
                      type="password"
                      placeholder="Digite a nova senha"
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recovery-confirm-password">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="recovery-confirm-password"
                      type="password"
                      placeholder="Confirme a nova senha"
                      value={recoveryConfirmPassword}
                      onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button type="submit" className="w-full">
                  Recuperar Senha
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Login;
