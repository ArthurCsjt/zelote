
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Computer } from "lucide-react";

/**
 * Página de login do sistema
 * Permite que os usuários façam login com nome de usuário e senha
 */
const Login = () => {
  // === ESTADOS (STATES) ===
  // Estados para armazenar os valores dos campos do formulário
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Hook para navegação entre rotas
  const navigate = useNavigate();

  /**
   * Função que processa o envio do formulário de login
   * @param e - Evento de submit do formulário
   */
  const handleSubmit = (e: React.FormEvent) => {
    // Previne o comportamento padrão do formulário (recarregar a página)
    e.preventDefault();
    
    // Verificação básica dos campos
    if (!username || !password) {
      // Exibe mensagem de erro se algum campo estiver vazio
      toast({
        title: "Erro de login",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    // Exemplo de credenciais fixas para demonstração
    // Em um sistema real, isso seria verificado contra um banco de dados ou API
    if (username === "admin" && password === "admin123") {
      // Login bem-sucedido
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo ao sistema de gestão de Chromebooks",
      });
      
      // Simula armazenamento do estado de autenticação (simplificado)
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", username);
      
      // Redireciona para a página principal
      navigate("/");
    } else {
      // Credenciais inválidas
      toast({
        title: "Erro de login",
        description: "Nome de usuário ou senha incorretos",
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
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                placeholder="Digite seu nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
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
