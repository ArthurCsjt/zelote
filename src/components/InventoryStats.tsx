import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Computer, CheckCircle, Clock, AlertTriangle, MapPin, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Chromebook } from '@/types/database';

interface InventoryStatsProps {
  chromebooks: Chromebook[];
}

const COLORS = ['#22C55E', '#8B5CF6', '#F59E0B', '#3B82F6', '#6B7280']; // Verde, Roxo, Amarelo, Azul, Cinza

export function InventoryStats({ chromebooks }: InventoryStatsProps) {
  const total = chromebooks.length;
  
  // Calcular contagens por status
  const stats = chromebooks.reduce((acc, cb) => {
    acc[cb.status] = (acc[cb.status] || 0) + 1;
    return acc;
  }, {} as Record<Chromebook['status'], number>);

  const data = [
    { name: 'Disponível', value: stats.disponivel || 0, color: COLORS[0] },
    { name: 'Emprestado', value: stats.emprestado || 0, color: COLORS[1] },
    { name: 'Manutenção', value: stats.manutencao || 0, color: COLORS[2] },
    { name: 'Fixo', value: stats.fixo || 0, color: COLORS[3] },
    { name: 'Inativo', value: stats.fora_uso || 0, color: COLORS[4] },
  ].filter(item => item.value > 0);

  // Calcular contagens de mobilidade
  const totalFixo = stats.fixo || 0;
  const totalInativo = stats.fora_uso || 0;
  const totalMovel = total - totalFixo - totalInativo;

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 mb-6">
      {/* Card de Estatísticas Principais */}
      <Card className="glass-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Computer className="h-5 w-5 text-primary" />
            Resumo do Inventário ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <p className="text-2xl font-bold text-blue-700">{totalMovel}</p>
              <p className="text-xs text-muted-foreground">Móveis</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Gráfico de Pizza */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            Distribuição de Status
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] p-2">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Nenhum dado para exibir.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}