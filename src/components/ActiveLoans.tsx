
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export interface Loan {
  id: string;
  studentName: string;
  ra: string;
  chromebookId: string;
  timestamp: Date;
}

interface ActiveLoansProps {
  loans: Loan[];
  onReturn: (loanId: string) => void;
}

export function ActiveLoans({ loans, onReturn }: ActiveLoansProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Empréstimos Ativos
      </h2>
      <div className="space-y-3">
        {loans.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            Nenhum empréstimo ativo
          </p>
        ) : (
          loans.map((loan) => (
            <div
              key={loan.id}
              className="bg-gray-50 border border-gray-100 rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium text-gray-800">
                    {loan.studentName}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-white">
                      RA: {loan.ra}
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                      Chromebook: {loan.chromebookId}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => onReturn(loan.id)}
                  className="ml-4 border-gray-200 hover:bg-gray-100"
                >
                  Devolver
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
