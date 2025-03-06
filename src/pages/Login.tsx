
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Computer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; // Importa o hook de autenticação

/**
 * Página de login do sistema
 * Permite que os usuários façam login com email e senha
 */
const Login = () => {
  // === ESTADOS (STATES) ===
  // Estados para armazenar os valores dos campos do formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Hook para navegação entre rotas
  const navigate = useNavigate();
  
  // Hook para acessar o contexto de autenticação
  const { login } = useAuth();

  /**
   * Função para verificar se o email possui o domínio correto
   * @param email - Email a ser verificado
   * @returns Verdadeiro se o email tiver o domínio @colegiosaojudas.com.br
   */
  const validateEmailDomain = (email: string): boolean => {
    const domainRegex = /@colegiosaojudas\.com\.br$/i;
    return domainRegex.test(email);
  };

  /**
   * Função que processa o envio do formulário de login
   * @param e - Evento de submit do formulário
   */
  const handleSubmit = (e: React.FormEvent) => {
    // Previne o comportamento padrão do formulário (recarregar a página)
    e.preventDefault();
    
    // Verificação básica dos campos
    if (!email || !password) {
      // Exibe mensagem de erro se algum campo estiver vazio
      toast({
        title: "Erro de login",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    // Verifica se o email possui o domínio correto
    if (!validateEmailDomain(email)) {
      toast({
        title: "Erro de login",
        description: "O email deve ter o domínio @colegiosaojudas.com.br",
        variant: "destructive",
      });
      return;
    }

    // Extrai o nome de usuário do email (parte antes do @)
    const username = email.split('@')[0];

    // Exemplo de credenciais fixas para demonstração
    // Em um sistema real, isso seria verificado contra um banco de dados ou API
    if (password === "admin123") { // Verifica apenas a senha
      // Login bem-sucedido
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo ao sistema de gestão de Chromebooks",
      });
      
      // Executa a função de login do contexto
      login(username, email);
      
      // Redireciona para a página principal
      navigate("/");
    } else {
      // Credenciais inválidas
      toast({
        title: "Erro de login",
        description: "Senha incorreta",
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
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Institucional</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@colegiosaojudas.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Use seu email institucional com o domínio @colegiosaojudas.com.br
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
