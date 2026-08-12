import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // O Supabase Auth lida com o hash/query params automaticamente quando o cliente é inicializado.
    // Nós apenas esperamos a confirmação da sessão para garantir que o usuário está logado.
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Erro no callback de autenticação:", error.message);
        navigate("/login");
        return;
      }

      if (session) {
        // Redireciona para o dashboard após sucesso
        navigate("/");
      } else {
        // Se não houver sessão imediata, o onAuthStateChange no AuthProvider cuidará disso,
        // mas adicionamos um timeout de segurança aqui.
        const timeout = setTimeout(() => navigate("/login"), 5000);
        return () => clearTimeout(timeout);
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="neo-brutal-card p-8 bg-card flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Finalizando Acesso</h2>
          <p className="text-sm text-muted-foreground mt-1">Sincronizando sua conta do Google...</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
