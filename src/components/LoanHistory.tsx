
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
          history.map((loan) => (
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
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-green-600">
                      Retirada: {format(loan.timestamp, "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                    {loan.returnRecord && (
                      <span className="text-orange-600">
                        Devolução: {format(loan.returnRecord.returnTime, "dd/MM/yyyy 'às' HH:mm")}
                        {loan.returnRecord.returnedBy.email !== loan.email && (
                          <span className="ml-2 text-gray-600">
                            (por {loan.returnRecord.returnedBy.name})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
