import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Clock, Monitor, User, CheckCircle, AlertTriangle } from "lucide-react";
import type { LoanHistoryItem } from "@/types/database";

interface LoanHistoryProps {
  history: LoanHistoryItem[];
}

export function LoanHistory({ history }: LoanHistoryProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Histórico de Empréstimos</h2>
        <Badge variant="secondary">{history.length}</Badge>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum registro no histórico</p>
              <p className="text-sm">Ainda não há empréstimos registrados</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {history.map((loan) => {
            const isReturned = loan.status === 'devolvido';
            const returnedByDifferentUser = isReturned && 
              loan.returned_by_email && 
              loan.returned_by_email !== loan.student_email;

            return (
              <Card key={loan.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold text-lg">{loan.student_name}</h3>
                          <p className="text-sm text-muted-foreground">{loan.student_email}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={isReturned ? "default" : "secondary"}
                        className={isReturned ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        {isReturned ? "Devolvido" : "Ativo"}
                      </Badge>
                    </div>

                    {/* Info badges */}
                    <div className="flex flex-wrap gap-2">
                      {loan.student_ra && (
                        <Badge variant="outline">
                          RA: {loan.student_ra}
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        <Monitor className="h-3 w-3 mr-1" />
                        {loan.chromebook_id}
                      </Badge>
                      {loan.chromebook_model && (
                        <Badge variant="outline">
                          {loan.chromebook_model}
                        </Badge>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {loan.user_type}
                      </Badge>
                      {loan.loan_type === 'lote' && (
                        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                          Lote
                        </Badge>
                      )}
                    </div>

                    {/* Purpose */}
                    <div className="text-sm">
                      <span className="font-medium">Finalidade: </span>
                      <span>{loan.purpose}</span>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3">
                      {/* Empréstimo */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">Empréstimo realizado</span>
                          </div>
                          <span className="text-sm text-green-700">
                            {format(new Date(loan.loan_date), "dd/MM/yyyy 'às' HH:mm")}
                          </span>
                        </div>
                      </div>

                      {/* Devolução */}
                      {isReturned && loan.return_date && (
                        <div className={`border rounded-lg p-3 ${
                          returnedByDifferentUser 
                            ? 'bg-orange-50 border-orange-200' 
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {returnedByDifferentUser ? (
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-blue-600" />
                              )}
                              <span className={`font-medium ${
                                returnedByDifferentUser ? 'text-orange-800' : 'text-blue-800'
                              }`}>
                                Devolução realizada
                              </span>
                            </div>
                            <span className={`text-sm ${
                              returnedByDifferentUser ? 'text-orange-700' : 'text-blue-700'
                            }`}>
                              {format(new Date(loan.return_date), "dd/MM/yyyy 'às' HH:mm")}
                            </span>
                          </div>
                          
                          {returnedByDifferentUser && loan.returned_by_name && (
                            <div className="mt-2 pt-2 border-t border-orange-200">
                              <div className="text-sm text-orange-700">
                                <span className="font-medium">Devolvido por: </span>
                                <span>{loan.returned_by_name}</span>
                                {loan.returned_by_email && (
                                  <span className="text-orange-600"> ({loan.returned_by_email})</span>
                                )}
                              </div>
                            </div>
                          )}

                          {loan.return_notes && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Observações: </span>
                                <span>{loan.return_notes}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}