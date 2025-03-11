
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { Loan } from "./ActiveLoans";

interface LoanHistoryProps {
  history: Loan[];
}

export function LoanHistory({ history }: LoanHistoryProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Histórico de Empréstimos
      </h2>
      <div className="space-y-3">
        {history.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            Nenhum registro no histórico
          </p>
        ) : (
          history.map((loan) => {
            // Verifica se a devolução foi feita por outra pessoa
            const returnedByDifferentUser = loan.returnRecord && 
              loan.returnRecord.returnedBy.email !== loan.email;

            return (
              <div
                key={loan.id}
                className="bg-gray-50 border border-gray-100 rounded-lg p-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-800">
                      {loan.studentName}
                    </h3>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                      Chromebook: {loan.chromebookId}
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <p>Finalidade: {loan.purpose}</p>
                    
                    <div className="space-y-2 mt-2">
                      {/* Informação de Retirada - Fundo Verde Suave */}
                      <div className="bg-[#F2FCE2] text-[#2B7A0B] rounded-md px-3 py-2 flex justify-between items-center">
                        <span className="font-medium">Retirada</span>
                        <span>{format(loan.timestamp, "dd/MM/yyyy 'às' HH:mm")}</span>
                      </div>

                      {/* Informação de Devolução - Fundo Laranja Suave */}
                      {loan.returnRecord && (
                        <div className={`rounded-md px-3 py-2 flex flex-col gap-1
                          ${returnedByDifferentUser 
                            ? 'bg-[#FEC6A1] text-[#9A3412]' // Laranja mais forte para devolução por outro usuário
                            : 'bg-[#FDE1D3] text-[#C2410C]' // Laranja mais suave para devolução pelo mesmo usuário
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Devolução</span>
                            <span>{format(loan.returnRecord.returnTime, "dd/MM/yyyy 'às' HH:mm")}</span>
                          </div>
                          
                          {/* Mostra informação do usuário que devolveu se for diferente */}
                          {returnedByDifferentUser && (
                            <div className="text-xs border-t border-[#9A3412]/20 pt-1 mt-1">
                              <span>Devolvido por: </span>
                              <span className="font-medium">
                                {loan.returnRecord.returnedBy.name} ({loan.returnRecord.returnedBy.email})
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
