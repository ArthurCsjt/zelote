import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Computer, CheckCircle, Clock, AlertTriangle, MapPin, PieChart as PieChartIcon } from 'lucide-react';
import type { Chromebook } from '@/types/database';

interface InventoryStatsProps {
  chromebooks: Chromebook[];
}

export function InventoryStats({ chromebooks }: InventoryStatsProps) {
  const total = chromebooks.length;
  
  // Calcular contagens por status
  const stats = chromebooks.reduce((acc, cb) => {
    acc[cb.status] = (acc[cb.status] || 0) + 1;
    return acc;
  }, {} as Record<Chromebook['status'], number>);

  // Calcular contagens de mobilidade
  const totalFixo = stats.fixo || 0;
  const totalInativo = stats.fora_uso || 0;
  const totalMovel = total - totalFixo - totalInativo;

  return (
    <div className="grid gap-4 grid-cols-1 mb-6">
      {/* Card de Estatísticas Principais (agora ocupa 100% da largura) */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Computer className="h-5 w-5 text-primary" />
            Resumo do Inventário ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{stats.disponivel || 0}</p>
              <p className="text-xs text-muted-foreground">Disponíveis</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-700">{stats.emprestado || 0}</p>
              <p className="text-xs text-muted-foreground">Emprestados</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-700">{stats.manutencao || 0}</p>
              <p className="text-xs text-muted-foreground">Manutenção</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-700">{totalFixo}</p>
              <p className="text-xs text-muted-foreground">Fixos</p>
            </div>
            <div className="text-center p-3 bg-gray-100 rounded-lg">
              <XCircle className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-700">{totalInativo}</p>
              <p className="text-xs text-muted-foreground">Inativos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}