import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Computer, User, Lock, Mail, ArrowLeft, KeySquare, LockKeyhole } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// ESTE COMPONENTE FOI SIMPLIFICADO PARA REMOVER O SISTEMA DE ABAS E O CADASTRO

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveryMode, setRecoveryMode] = useState(false); // Novo estado para controlar a tela de recuperação

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const navigate = useNavigate();
  const { login, resetPassword, verifyEmail } = useAuth();

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

    // A função verifyEmail não é mais necessária aqui, a própria resetPassword já valida.
    const result = await resetPassword(recoveryEmail);
    if (result.success) {
      toast({
        title: "Recuperação iniciada",
        description: "Enviamos um email com instruções para redefinir sua senha."
      });
      setRecoveryEmail("");
      setRecoveryMode(false); // Volta para a tela de login
    } else {
      toast({
        title: "Erro de recuperação",
        description: result.error || "Não foi possível iniciar a recuperação de senha",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#D3E4FD] to-[#F0F7FF] p-4">
      <Card className="w-full max-w-md shadow-xl glass-card border-0 overflow-hidden">
        <CardHeader className="space-y-1 text-center pb-6 bg-gradient-to-r from-blue-500/10 to-blue-600/10">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-blue-100 shadow-md">
              <Computer className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-blue-800">Zelote</CardTitle>
          <CardDescription className="text-gray-600">
            {isRecoveryMode ? "Recupere seu acesso ao sistema" : "Acesso restrito para usuários convidados"}
          </CardDescription>
        </CardHeader>
        
        {/* Renderização condicional: ou mostra Login, ou mostra Recuperação */}
        {!isRecoveryMode ? (
          // FORMULÁRIO DE LOGIN
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
        ) : (
          // FORMULÁRIO DE RECUPERAÇÃO DE SENHA
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
        )}
      </Card>
    </div>
  );
};

export default Login;