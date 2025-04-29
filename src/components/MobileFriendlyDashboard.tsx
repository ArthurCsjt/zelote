import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "./ui/badge";
import { Computer, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Loan } from "./ActiveLoans";

interface MobileFriendlyDashboardProps {
  activeLoans: Loan[];
  history: Loan[];
  onBack: () => void;
}

export function MobileFriendlyDashboard({ activeLoans, history, onBack }: MobileFriendlyDashboardProps) {
  const totalChromebooks = 50;
  const availableChromebooks = totalChromebooks - activeLoans.length;

  // Handler with event prevention to ensure clean navigation
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof onBack === 'function') {
      onBack();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between items-start gap-4 mb-4">
        <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Dashboard</h2>
        <Button 
          variant="outline" 
          onClick={handleBack}
          size="sm"
          className="flex items-center gap-1 hover:bg-blue-50 px-2 w-full justify-center"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Menu</span>
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">
              Empréstimos Hoje
            </CardTitle>
            <Computer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-xl font-bold">{history.filter(loan => {
              const today = new Date();
              const loanDate = new Date(loan.timestamp);
              return loanDate.getDate() === today.getDate() && 
                     loanDate.getMonth() === today.getMonth() && 
                     loanDate.getFullYear() === today.getFullYear();
            }).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">
              Chromebooks
            </CardTitle>
            <Computer className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-xl font-bold">{activeLoans.length}</div>
            <p className="text-xs text-muted-foreground">
              em uso de {totalChromebooks}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="py-2">
          <CardTitle className="text-sm">Empréstimos Ativos</CardTitle>
          <CardDescription className="text-xs">
            {activeLoans.length} Chromebooks em uso
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[300px] overflow-y-auto py-2">
          {activeLoans.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Computer className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum empréstimo ativo</p>
            </div>
          )}
          
          {activeLoans.map((loan) => (
            <div
              key={loan.id}
              className="mb-2 p-3 bg-blue-50 border border-blue-100 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{loan.studentName}</p>
                  <p className="text-xs text-gray-600">ID: {loan.chromebookId}</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                  Pendente
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Retirada: {format(loan.timestamp, "dd/MM HH:mm")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
