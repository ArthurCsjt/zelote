
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "./ui/progress";
import { Computer, ArrowLeft, Calendar, BarChart, Clock, Activity } from "lucide-react";
import { format, startOfDay, isToday, isWithinInterval, subDays, differenceInMinutes } from "date-fns";
import { Loan } from "./ActiveLoans";

interface MobileFriendlyDashboardProps {
  activeLoans: Loan[];
  history: Loan[];
  onBack: () => void;
}

export function MobileFriendlyDashboard({ activeLoans, history, onBack }: MobileFriendlyDashboardProps) {
  const totalChromebooks = 50;
  const availableChromebooks = totalChromebooks - activeLoans.length;
  const [periodView, setPeriodView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const handleBackToMenu = () => {
    console.log('Botão voltar pressionado - Utilizando callback onBack');
    onBack();
  };

  // Cálculos para estatísticas
  const today = startOfDay(new Date());
  
  // Filtro conforme período selecionado
  const getPeriodLoans = () => {
    let filteredLoans = [];
    const currentDate = new Date();
    
    switch(periodView) {
      case 'daily':
        filteredLoans = history.filter(loan => isToday(loan.timestamp));
        break;
      case 'weekly':
        filteredLoans = history.filter(loan => 
          isWithinInterval(loan.timestamp, {
            start: subDays(currentDate, 7),
            end: currentDate
          })
        );
        break;
      case 'monthly':
        filteredLoans = history.filter(loan => 
          isWithinInterval(loan.timestamp, {
            start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
            end: currentDate
          })
        );
        break;
    }
    return filteredLoans;
  };

  const periodLoans = getPeriodLoans();
  const periodReturns = periodLoans.filter(loan => loan.returnRecord);
  
  // Cálculo da taxa de devolução
  const completionRate = periodLoans.length > 0 
    ? (periodReturns.length / periodLoans.length) * 100 
    : 0;
  
  // Cálculo do tempo médio de uso
  const averageUsageTime = periodReturns.reduce((acc, loan) => {
    if (loan.returnRecord) {
      const duration = differenceInMinutes(
        loan.returnRecord.returnTime, 
        loan.timestamp
      );
      return acc + duration;
    }
    return acc;
  }, 0) / (periodReturns.length || 1);

  // Texto do período selecionado
  const periodText = {
    daily: 'Hoje',
    weekly: '7 Dias',
    monthly: 'Este Mês'
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between items-start gap-4 mb-4">
        <div className="flex w-full justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Dashboard</h2>
          <Button 
            variant="back"
            size="default"
            onClick={handleBackToMenu}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="daily" className="w-full" onValueChange={(v) => setPeriodView(v as 'daily' | 'weekly' | 'monthly')}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="daily" className="text-xs">Diário</TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs">Semanal</TabsTrigger>
          <TabsTrigger value="monthly" className="text-xs">Mensal</TabsTrigger>
        </TabsList>
        
        <div className="grid gap-3 grid-cols-2 mb-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">
                Empréstimos
              </CardTitle>
              <BarChart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-xl font-bold">{periodLoans.length}</div>
              <p className="text-xs text-muted-foreground">
                {periodText[periodView]}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
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
        
        <div className="grid gap-3 grid-cols-2 mb-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">
                Tempo Médio
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-xl font-bold">{Math.round(averageUsageTime)} min</div>
              <p className="text-xs text-muted-foreground">
                por empréstimo
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">
                Taxa de Devolução
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-xl font-bold">{completionRate.toFixed(0)}%</div>
              <div className="mt-1">
                <Progress value={completionRate} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </Tabs>

      <Card className="overflow-hidden border-t-4 border-t-blue-500">
        <CardHeader className="py-2 bg-gradient-to-r from-blue-50 to-white">
          <CardTitle className="text-sm">Empréstimos Ativos</CardTitle>
          <CardDescription className="text-xs">
            {activeLoans.length} Chromebooks em uso
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[350px] overflow-y-auto py-2">
          {activeLoans.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <Computer className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum empréstimo ativo</p>
            </div>
          )}
          
          {activeLoans.map((loan) => (
            <div
              key={loan.id}
              className="mb-3 p-3 bg-blue-50 border-l-4 border-l-blue-500 rounded-lg shadow-sm"
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
