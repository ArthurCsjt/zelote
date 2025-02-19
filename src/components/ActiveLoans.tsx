
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
    <Card className="glass-card w-full fade-enter">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">
          Empréstimos Ativos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loans.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Nenhum empréstimo ativo
            </p>
          ) : (
            loans.map((loan) => (
              <Card key={loan.id} className="p-4 slide-enter">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium">{loan.studentName}</h3>
                    <div className="flex gap-2">
                      <Badge variant="outline">RA: {loan.ra}</Badge>
                      <Badge variant="secondary">
                        Chromebook: {loan.chromebookId}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => onReturn(loan.id)}
                    className="ml-4"
                  >
                    Devolver
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
