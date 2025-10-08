
import React, { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
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
import { Computer, ArrowLeft, Calendar, BarChart, Clock, Activity, Users } from "lucide-react";
import { format, startOfDay, isToday, isWithinInterval, subDays, differenceInMinutes } from "date-fns";
import type { LoanHistoryItem } from "@/types/database";

interface MobileFriendlyDashboardProps {
  onBack?: () => void;
}

export function MobileFriendlyDashboard({ onBack }: MobileFriendlyDashboardProps) {
  const { getLoanHistory, getChromebooks } = useDatabase();
  const [activeLoans, setActiveLoans] = useState<LoanHistoryItem[]>([]);
  const [history, setHistory] = useState<LoanHistoryItem[]>([]);
  const [chromebooks, setChromebooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const totalChromebooks = chromebooks.length;
  const availableChromebooks = totalChromebooks - activeLoans.length;
  const [periodView, setPeriodView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Buscar dados iniciais
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyData, chromebooksData] = await Promise.all([
        getLoanHistory(),
        getChromebooks()
      ]);
      
      setHistory(historyData);
      setChromebooks(chromebooksData);
      setActiveLoans(historyData.filter(loan => !loan.return_date));
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [getLoanHistory, getChromebooks]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Cálculos para estatísticas
  const today = startOfDay(new Date());
  
  // Filtro conforme período selecionado
  const getPeriodLoans = () => {
    let filteredLoans = [];
    const currentDate = new Date();
    
    switch(periodView) {
      case 'daily':
        filteredLoans = history.filter(loan => isToday(new Date(loan.loan_date)));
        break;
      case 'weekly':
        filteredLoans = history.filter(loan => 
          isWithinInterval(new Date(loan.loan_date), {
            start: subDays(currentDate, 7),
            end: currentDate
          })
        );
        break;
      case 'monthly':
        filteredLoans = history.filter(loan => 
          isWithinInterval(new Date(loan.loan_date), {
            start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
            end: currentDate
          })
        );
        break;
    }
    return filteredLoans;
  };

  const periodLoans = getPeriodLoans();
  const periodReturns = periodLoans.filter(loan => loan.return_date);
  
  // Cálculo da taxa de devolução
  const completionRate = periodLoans.length > 0 
    ? (periodReturns.length / periodLoans.length) * 100 
    : 0;
  
  // Cálculo do tempo médio de uso
  const averageUsageTime = periodReturns.reduce((acc, loan) => {
    if (loan.return_date) {
      const duration = differenceInMinutes(
        new Date(loan.return_date), 
        new Date(loan.loan_date)
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
    <div className="space-y-4 glass-morphism p-6 animate-fade-in relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-50/30 via-blue-50/20 to-pink-50/30 rounded-3xl blur-2xl transform scale-110" />
      
      <div className="flex flex-col justify-between items-start gap-4 mb-4 relative z-10">
        <div className="flex w-full justify-center items-center">
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Dashboard</h2>
        </div>
      </div>

      <Tabs defaultValue="daily" className="w-full" onValueChange={(v) => setPeriodView(v as 'daily' | 'weekly' | 'monthly')}>
        <TabsList className="grid grid-cols-3 mb-4 w-full">
          <TabsTrigger value="daily" className="text-xs px-2 py-1.5">Diário</TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs px-2 py-1.5">Semanal</TabsTrigger>
          <TabsTrigger value="monthly" className="text-xs px-2 py-1.5">Mensal</TabsTrigger>
        </TabsList>
        
        <div className="grid gap-3 grid-cols-2 mb-3 relative z-10">
          <Card className="glass-card border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">
                Empréstimos
              </CardTitle>
              <BarChart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{periodLoans.length}</div>
              <p className="text-xs text-muted-foreground">
                {periodText[periodView]}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">
                Chromebooks
              </CardTitle>
              <Computer className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{activeLoans.length}</div>
              <p className="text-xs text-muted-foreground">
                em uso de {totalChromebooks}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-3 grid-cols-2 mb-4 relative z-10">
          <Card className="glass-card border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">
                Tempo Médio
              </CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">{Math.round(averageUsageTime)} min</div>
              <p className="text-xs text-muted-foreground">
                por empréstimo
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">
                Taxa de Devolução
              </CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">{completionRate.toFixed(0)}%</div>
              <div className="mt-1">
                <Progress value={completionRate} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </Tabs>

      {/* Gráficos de pizza para mobile */}
      <div className="grid gap-3 grid-cols-2 mb-4 relative z-10">
        <Card className="glass-card border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">
              Uso por Usuário
            </CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs">Alunos</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-1">
                  {periodLoans.filter(l => l.user_type === 'aluno').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Professores</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs px-1">
                  {periodLoans.filter(l => l.user_type === 'professor').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Funcionários</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs px-1">
                  {periodLoans.filter(l => l.user_type === 'funcionario').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">
              Status Geral
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs">Disponíveis</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs px-1">
                  {availableChromebooks}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Em Uso</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-1">
                  {activeLoans.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Utilização</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs px-1">
                  {((activeLoans.length / totalChromebooks) * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-white/30 overflow-hidden border-t-4 border-t-blue-500 relative z-10 hover:shadow-lg transition-all duration-300">
        <CardHeader className="py-2 bg-gradient-to-r from-blue-50/50 to-white/50 backdrop-blur-xl">
          <CardTitle className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Empréstimos Ativos</CardTitle>
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
              className="mb-3 p-3 glass-card border-white/30 border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{loan.student_name}</p>
                  <p className="text-xs text-gray-600">ID: {loan.chromebook_id}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-1 ${
                        loan.user_type === 'aluno' ? 'border-blue-200 text-blue-700' :
                        loan.user_type === 'professor' ? 'border-green-200 text-green-700' :
                        'border-orange-200 text-orange-700'
                      }`}
                    >
                      {loan.user_type?.charAt(0).toUpperCase() + loan.user_type?.slice(1)}
                    </Badge>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                  Pendente
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Retirada: {format(new Date(loan.loan_date), "dd/MM HH:mm")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
