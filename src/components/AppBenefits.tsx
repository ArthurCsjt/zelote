import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Zap, Shield, BarChart3, QrCode, Clock, ListChecks } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { cn } from '@/lib/utils';

const benefits = [
  {
    title: "Empréstimo Rápido (QR)",
    description: "Use o scanner para registrar empréstimos e devoluções em segundos.",
    icon: QrCode,
    color: "text-menu-teal",
  },
  {
    title: "Inventário em Tempo Real",
    description: "Status e localização de cada Chromebook sempre atualizados.",
    icon: Shield,
    color: "text-menu-blue",
  },
  {
    title: "Análise de Uso",
    description: "Descubra picos de uso e visualize o histórico em dashboards claros.",
    icon: BarChart3,
    color: "text-menu-dark-blue",
  },
  {
    title: "Contagem Simples",
    description: "Auditoria física rápida para identificar itens faltantes e discrepâncias.",
    icon: ListChecks,
    color: "text-menu-rose",
  },
];

export const AppBenefits: React.FC = () => {
  return (
    <div className="mt-12 pt-6 max-w-6xl mx-auto">
      {/* Título removido */}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <GlassCard 
              key={index} 
              className={cn(
                "p-2 text-center transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
                "border-l-4 border-gray-200 hover:border-l-primary"
              )}
            >
              <CardContent className="p-0 space-y-1">
                <div className="flex justify-center pt-1">
                  {/* Ícone menor: h-5 w-5 */}
                  <Icon className={cn("h-5 w-5", benefit.color)} />
                </div>
                {/* Título menor: text-sm */}
                <CardTitle className="text-sm font-semibold text-gray-800">
                  {benefit.title}
                </CardTitle>
                {/* Descrição menor: text-xs */}
                <CardDescription className="text-xs text-muted-foreground">
                  {benefit.description}
                </CardDescription>
              </CardContent>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};