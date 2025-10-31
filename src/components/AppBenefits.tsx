import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Zap, Shield, BarChart3, QrCode, Clock, ListChecks } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { cn } from '@/lib/utils';

const benefits = [
  {
    title: "Agilidade com QR Code",
    description: "Cadastre e realize empréstimos/devoluções em segundos usando o scanner integrado.",
    icon: QrCode,
    color: "text-menu-teal",
  },
  {
    title: "Controle Total do Inventário",
    description: "Saiba exatamente onde cada Chromebook está, seu status e condição em tempo real.",
    icon: Shield,
    color: "text-menu-blue",
  },
  {
    title: "Análise de Uso Inteligente",
    description: "Visualize dashboards com taxas de ocupação, picos de uso e histórico de empréstimos.",
    icon: BarChart3,
    color: "text-menu-dark-blue",
  },
  {
    title: "Auditoria Física Simplificada",
    description: "Realize contagens de inventário de forma rápida e identifique discrepâncias automaticamente.",
    icon: ListChecks,
    color: "text-menu-rose",
  },
];

export const AppBenefits: React.FC = () => {
  return (
    <div className="mt-12 pt-8 border-t border-gray-200 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6 flex items-center justify-center gap-2">
        <Zap className="h-6 w-6 text-primary" />
        Por que usar o Zelote?
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <GlassCard 
              key={index} 
              className={cn(
                "p-4 text-center transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
                "border-l-4 border-gray-200 hover:border-l-primary"
              )}
            >
              <CardContent className="p-0 space-y-3">
                <div className="flex justify-center">
                  <Icon className={cn("h-8 w-8", benefit.color)} />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {benefit.title}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
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