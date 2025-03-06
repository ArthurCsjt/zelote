
import { useState } from "react";
import { LoanForm } from "@/components/LoanForm";
import { ActiveLoans, Loan, ReturnDataType } from "@/components/ActiveLoans";
import { toast } from "@/components/ui/use-toast";
import { ChromebookRegistration } from "@/components/ChromebookRegistration";
import { MainMenu } from "@/components/MainMenu";
import { Header } from "@/components/Header";
import { ReturnDialog } from "@/components/ReturnDialog";
import { Button } from "@/components/ui/button";
import { LoanHistory } from "@/components/LoanHistory";
import { Dashboard } from "@/components/Dashboard";

// Componente principal da página inicial do sistema de gestão de empréstimos de Chromebooks
const Index = () => {
  // === ESTADOS (STATES) ===
  // Estados são variáveis especiais do React que, quando alteradas, causam a re-renderização do componente
  
  // Lista de empréstimos ativos no sistema
  const [loans, setLoans] = useState<Loan[]>([]);
  
  // Histórico de empréstimos já devolvidos
  const [history, setHistory] = useState<Loan[]>([]);
  
  // Controla a abertura/fechamento do diálogo de devolução
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  
  // ID do Chromebook a ser devolvido
  const [chromebookId, setChromebookId] = useState("");
  
  // Dados da pessoa que está devolvendo o dispositivo
  const [returnData, setReturnData] = useState<ReturnDataType>({ 
    name: "", 
    ra: "", 
    email: "",
    type: 'individual', // Tipo de devolução: individual ou lote
    userType: 'aluno'   // Tipo de usuário: aluno, professor ou funcionário
  });
  
  // Controla a visibilidade do formulário de empréstimo
  const [showLoanForm, setShowLoanForm] = useState(false);
  
  // Controla a visibilidade do formulário de cadastro de Chromebooks
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  
  // Controla a visibilidade do painel de estatísticas (dashboard)
  const [showDashboard, setShowDashboard] = useState(false);

  // === FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ===

  /**
   * Função para navegar entre as diferentes telas do sistema
   * @param route - Rota desejada: 'registration', 'dashboard', 'loan' ou 'return'
   */
  const handleNavigation = (route: 'registration' | 'dashboard' | 'loan' | 'return') => {
    switch (route) {
      case 'registration':
        // Mostrar tela de cadastro de Chromebooks
        setShowRegistrationForm(true);
        setShowLoanForm(false);
        setShowDashboard(false);
        break;
      case 'dashboard':
        // Mostrar tela de estatísticas
        setShowDashboard(true);
        setShowLoanForm(false);
        setShowRegistrationForm(false);
        break;
      case 'loan':
        // Mostrar tela de empréstimo
        setShowLoanForm(true);
        setShowRegistrationForm(false);
        setShowDashboard(false);
        break;
      case 'return':
        // Abrir diálogo de devolução
        setOpenReturnDialog(true);
        break;
    }
  };

  /**
   * Função chamada quando um novo empréstimo é realizado
   * @param formData - Dados do formulário de empréstimo
   */
  const handleNewLoan = (formData: {
    studentName: string;
    ra?: string;
    email: string;
    chromebookId: string;
    purpose: string;
    userType: 'aluno' | 'professor' | 'funcionario';
    loanType: 'individual' | 'lote';
  }) => {
    // Cria um novo objeto de empréstimo com os dados do formulário e um ID único
    const newLoan: Loan = {
      id: Math.random().toString(36).substring(7), // Gera um ID único para o empréstimo
      ...formData, // Copia todos os dados do formulário
      timestamp: new Date(), // Adiciona a data/hora atual
    };
    
    // Adiciona o novo empréstimo à lista de empréstimos ativos
    setLoans([...loans, newLoan]);
  };

  /**
   * Função chamada ao clicar no botão de confirmação da devolução
   * Processa a devolução individual ou em lote, dependendo do tipo selecionado
   */
  const handleReturnClick = () => {
    // Verifica se é uma devolução individual ou em lote
    if (returnData.type === 'individual') {
      // === DEVOLUÇÃO INDIVIDUAL ===
      
      // Procura o empréstimo pelo ID do Chromebook
      const loanToReturn = loans.find((loan) => loan.chromebookId === chromebookId);
      
      // Se não encontrar o empréstimo, exibe uma mensagem de erro
      if (!loanToReturn) {
        toast({
          title: "Erro",
          description: "Chromebook não encontrado ou não está emprestado",
          variant: "destructive",
        });
        return;
      }

      // Verifica se os campos obrigatórios foram preenchidos
      if (!returnData.name || !returnData.email) {
        toast({
          title: "Erro",
          description: "Por favor, preencha os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      // Processa a devolução do dispositivo
      handleReturn(loanToReturn.id, returnData);
    } else {
      // === DEVOLUÇÃO EM LOTE ===
      
      // Verifica se os campos obrigatórios foram preenchidos
      if (!returnData.name || !returnData.email) {
        toast({
          title: "Erro",
          description: "Por favor, preencha os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      // Divide a string de IDs separados por vírgula em um array
      const chromebookIds = chromebookId.split(',');
      let returnedCount = 0;
      
      // Processa cada ID individualmente
      chromebookIds.forEach(id => {
        // Procura o empréstimo pelo ID do Chromebook
        const loanToReturn = loans.find(loan => loan.chromebookId === id.trim());
        
        // Se encontrar, processa a devolução
        if (loanToReturn) {
          handleReturn(loanToReturn.id, returnData);
          returnedCount++;
        }
      });

      // Exibe mensagem de sucesso ou erro, dependendo do resultado
      if (returnedCount === 0) {
        toast({
          title: "Atenção",
          description: "Nenhum dispositivo encontrado para devolução",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: `${returnedCount} dispositivos devolvidos com sucesso`,
        });
      }
    }

    // Limpa os campos e fecha o diálogo após a devolução
    setOpenReturnDialog(false);
    setChromebookId("");
    setReturnData({ 
      name: "", 
      ra: "", 
      email: "",
      type: 'individual',
      userType: 'aluno'
    });
  };

  /**
   * Função que processa a devolução de um empréstimo
   * @param loanId - ID do empréstimo a ser devolvido
   * @param returnData - Dados da pessoa que está devolvendo
   */
  const handleReturn = (loanId: string, returnData: ReturnDataType) => {
    // Procura o empréstimo pelo ID
    const loanToReturn = loans.find((loan) => loan.id === loanId);
    if (!loanToReturn) return;

    // Cria um objeto de empréstimo com os dados de devolução
    const returnedLoan: Loan = {
      ...loanToReturn, // Mantém todos os dados originais do empréstimo
      returnRecord: {   // Adiciona as informações de devolução
        returnedBy: {
          name: returnData.name,
          ra: returnData.ra,
          email: returnData.email,
          type: returnData.userType
        },
        returnTime: new Date(), // Data/hora da devolução
        returnType: returnData.type // Tipo de devolução (individual ou lote)
      },
    };

    // Adiciona o empréstimo devolvido ao histórico e remove da lista de ativos
    setHistory([returnedLoan, ...history]);
    setLoans(loans.filter((loan) => loan.id !== loanId));

    // Verifica se o dispositivo foi devolvido pela mesma pessoa que pegou emprestado
    const returnedByDifferentPerson = 
      returnData.email !== loanToReturn.email;

    // Se for devolução individual, exibe uma mensagem de sucesso
    if (returnData.type === 'individual') {
      toast({
        title: "Chromebook Devolvido",
        description: returnedByDifferentPerson
          ? `Devolvido por ${returnData.name} (${returnData.email})`
          : "Devolvido pelo próprio solicitante",
      });
    }
  };

  // === RENDERIZAÇÃO DA INTERFACE (UI) ===
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho da aplicação */}
        <Header />

        {/* Menu principal (exibido quando nenhuma das telas específicas está ativa) */}
        {!showLoanForm && !showRegistrationForm && !showDashboard && (
          <MainMenu onNavigate={handleNavigation} />
        )}

        {/* Tela de Cadastro de Chromebook */}
        {showRegistrationForm && (
          <div>
            <ChromebookRegistration />
            <Button 
              variant="outline" 
              className="mt-4 w-full max-w-2xl mx-auto block"
              onClick={() => setShowRegistrationForm(false)}
            >
              Voltar ao Menu
            </Button>
          </div>
        )}

        {/* Tela de Dashboard */}
        {showDashboard && (
          <Dashboard 
            activeLoans={loans}
            history={history}
            onBack={() => {
              setShowDashboard(false);
            }}
          />
        )}

        {/* Tela de Empréstimo */}
        {showLoanForm && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Coluna esquerda - Formulário de empréstimo */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <LoanForm onSubmit={handleNewLoan} />
                <Button 
                  variant="outline" 
                  className="mt-4 w-full"
                  onClick={() => setShowLoanForm(false)}
                >
                  Voltar ao Menu
                </Button>
              </div>
              {/* Coluna direita - Lista de empréstimos ativos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <ActiveLoans loans={loans} onReturn={handleReturn} />
              </div>
            </div>
            
            {/* Histórico de empréstimos */}
            <LoanHistory history={history} />
          </div>
        )}

        {/* Diálogo de devolução (aberto quando openReturnDialog = true) */}
        <ReturnDialog
          open={openReturnDialog}
          onOpenChange={setOpenReturnDialog}
          chromebookId={chromebookId}
          onChromebookIdChange={setChromebookId}
          returnData={returnData}
          onReturnDataChange={setReturnData}
          onConfirm={handleReturnClick}
        />
      </div>
    </div>
  );
};

export default Index;
