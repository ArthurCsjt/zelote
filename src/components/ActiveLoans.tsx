
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { toast } from "./ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

// Define tipos e interfaces utilizados no componente

/**
 * Tipo para os dados de devolução
 * Contém informações sobre quem está devolvendo o dispositivo
 */
export type ReturnDataType = {
  name: string;                                   // Nome do solicitante
  ra?: string;                                    // RA (Registro Acadêmico), opcional
  email: string;                                  // Email do solicitante
  type: 'individual' | 'lote';                    // Tipo de devolução
  userType: 'aluno' | 'professor' | 'funcionario'; // Tipo de usuário
};

/**
 * Interface para o registro de devolução
 * Armazena detalhes sobre como o dispositivo foi devolvido
 */
export interface ReturnRecord {
  returnedBy: {                                  // Informações de quem devolveu
    name: string;                                // Nome
    ra?: string;                                 // RA (opcional)
    email: string;                               // Email
    type: 'aluno' | 'professor' | 'funcionario'; // Tipo de usuário
  };
  returnTime: Date;                              // Data/hora da devolução
  returnType: 'individual' | 'lote';             // Tipo de devolução
}

/**
 * Interface principal para um empréstimo
 * Contém todos os dados relacionados a um empréstimo de Chromebook
 */
export interface Loan {
  id: string;                                    // ID único do empréstimo
  studentName: string;                           // Nome do solicitante
  ra?: string;                                   // RA (opcional)
  email: string;                                 // Email do solicitante
  chromebookId: string;                          // ID do Chromebook
  purpose: string;                               // Finalidade do empréstimo
  timestamp: Date;                               // Data/hora do empréstimo
  userType: 'aluno' | 'professor' | 'funcionario'; // Tipo de usuário
  loanType?: 'individual' | 'lote';              // Tipo de empréstimo
  returnRecord?: ReturnRecord;                   // Registro de devolução (se já devolvido)
}

// Define a interface de props do componente
interface ActiveLoansProps {
  loans: Loan[];                                 // Lista de empréstimos ativos
  onReturn: (loanId: string, returnData: ReturnDataType) => void; // Callback de devolução
}

/**
 * Componente que exibe a lista de empréstimos ativos
 * Permite a devolução de dispositivos diretamente da lista
 */
export function ActiveLoans({ loans, onReturn }: ActiveLoansProps) {
  // === ESTADOS (STATES) ===
  
  // Controla a abertura/fechamento do diálogo de devolução
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  
  // Armazena o ID do empréstimo selecionado para devolução
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  
  // Dados da pessoa que está devolvendo o dispositivo
  const [returnData, setReturnData] = useState<ReturnDataType>({ 
    name: "", 
    ra: "", 
    email: "",
    type: 'individual',
    userType: 'aluno'
  });

  // === FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ===

  /**
   * Função chamada ao clicar no botão "Devolver" de um empréstimo
   * @param loanId - ID do empréstimo a ser devolvido
   */
  const handleReturnClick = (loanId: string) => {
    setSelectedLoanId(loanId);
    setOpenReturnDialog(true);
  };

  /**
   * Função chamada ao confirmar a devolução no diálogo
   * Valida os dados e chama a callback principal
   */
  const handleReturn = () => {
    // Verifica se os campos obrigatórios foram preenchidos
    if (!returnData.name || !returnData.email) {
      toast({
        title: "Erro",
        description: "Por favor, preencha os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Se há um empréstimo selecionado, processa a devolução
    if (selectedLoanId) {
      onReturn(selectedLoanId, returnData);
      
      // Limpa os campos e fecha o diálogo
      setOpenReturnDialog(false);
      setReturnData({ 
        name: "", 
        ra: "", 
        email: "",
        type: 'individual',
        userType: 'aluno'
      });
      setSelectedLoanId(null);
    }
  };

  // === RENDERIZAÇÃO DA INTERFACE (UI) ===
  return (
    <div className="glass-morphism p-6 animate-fade-in relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-50/30 via-blue-50/20 to-purple-50/30 rounded-3xl blur-2xl transform scale-110" />
      
      <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4 relative z-10">
        Empréstimos Ativos
      </h2>
      <div className="space-y-3 relative z-10">
        {loans.length === 0 ? (
          // Mensagem exibida quando não há empréstimos ativos
          <p className="text-center text-gray-500 py-4">
            Nenhum empréstimo ativo
          </p>
        ) : (
          // Lista de empréstimos ativos
          loans.map((loan) => (
            <div
              key={loan.id}
              className="glass-card p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] border-white/30"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {/* Nome do solicitante */}
                  <h3 className="font-medium text-gray-800">
                    {loan.studentName}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {/* Badge do RA (se disponível) */}
                    {loan.ra && (
                      <Badge variant="outline" className="bg-white">
                        RA: {loan.ra}
                      </Badge>
                    )}
                    {/* Badge do ID do Chromebook */}
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                      Chromebook: {loan.chromebookId}
                    </Badge>
                    {/* Badge de lote (se aplicável) */}
                    {loan.loanType === 'lote' && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">
                        Lote
                      </Badge>
                    )}
                  </div>
                  {/* Informações adicionais */}
                  <div className="flex gap-2 flex-wrap mt-2 text-sm">
                    <span>Finalidade: {loan.purpose}</span>
                    <span>•</span>
                    <span className="text-green-600 font-medium">
                      Retirada: {format(loan.timestamp, "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                  </div>
                </div>
                {/* Botão de devolução */}
                <Button
                  variant="outline"
                  onClick={() => handleReturnClick(loan.id)}
                  className="ml-4 glass-card border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Devolver
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Diálogo de devolução (aberto quando openReturnDialog = true) */}
      <Dialog open={openReturnDialog} onOpenChange={setOpenReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devolução de Chromebook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Seletor de tipo de devolução */}
            <div className="space-y-2">
              <Label htmlFor="returnType">Tipo de Devolução</Label>
              <Select
                value={returnData.type}
                onValueChange={(value: 'individual' | 'lote') =>
                  setReturnData({ ...returnData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de devolução" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="lote">Em Lote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de tipo de usuário */}
            <div className="space-y-2">
              <Label htmlFor="userType">Tipo de Solicitante</Label>
              <Select
                value={returnData.userType}
                onValueChange={(value: 'aluno' | 'professor' | 'funcionario') =>
                  setReturnData({ ...returnData, userType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de solicitante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aluno">Aluno</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="funcionario">Funcionário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campo de nome do solicitante */}
            <div className="space-y-2">
              <Label htmlFor="returnerName">Nome do Solicitante</Label>
              <Input
                id="returnerName"
                value={returnData.name}
                onChange={(e) => setReturnData({ ...returnData, name: e.target.value })}
                placeholder="Digite o nome do solicitante"
              />
            </div>

            {/* Campo de RA (apenas para alunos) */}
            {returnData.userType === 'aluno' && (
              <div className="space-y-2">
                <Label htmlFor="returnerRA">RA do Aluno (opcional)</Label>
                <Input
                  id="returnerRA"
                  value={returnData.ra}
                  onChange={(e) => setReturnData({ ...returnData, ra: e.target.value })}
                  placeholder="Digite o RA"
                />
              </div>
            )}

            {/* Campo de email */}
            <div className="space-y-2">
              <Label htmlFor="returnerEmail">Email</Label>
              <Input
                id="returnerEmail"
                type="email"
                value={returnData.email}
                onChange={(e) => setReturnData({ ...returnData, email: e.target.value })}
                placeholder="Digite o email"
                required
              />
            </div>
          </div>
          {/* Botões de ação */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReturnDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReturn}>
              Confirmar Devolução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
