
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

/**
 * Componente de página não encontrada (404)
 * Exibido quando o usuário tenta acessar uma rota que não existe
 */
const NotFound = () => {
  // Obtém informações sobre a localização atual (URL)
  const location = useLocation();

  // Efeito que registra um erro no console quando a página é carregada
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Renderiza a página de erro 404
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Página não encontrada</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Voltar para a Página Inicial
        </a>
      </div>
    </div>
  );
};

export default NotFound;
