import React from 'react';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Computer, X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceCardProps {
    deviceId: string;
    status?: 'disponivel' | 'emprestado' | 'manutencao' | 'baixado' | 'fixo' | 'fora_uso';
    lastUsed?: string;
    condition?: 'excelente' | 'bom' | 'regular' | 'ruim' | string | null;
    onRemove?: () => void;
    variant?: 'loan' | 'return';
    showDetails?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    disponivel: {
        label: 'Disponível',
        color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-500/30',
        icon: CheckCircle,
    },
    emprestado: {
        label: 'Emprestado',
        color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500/30',
        icon: Clock,
    },
    manutencao: {
        label: 'Manutenção',
        color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-500/30',
        icon: AlertCircle,
    },
    baixado: {
        label: 'Baixado',
        color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-500/30',
        icon: X,
    },
    fixo: {
        label: 'Fixo',
        color: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-500/30',
        icon: CheckCircle,
    },
    fora_uso: {
        label: 'Fora de Uso',
        color: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-500/30',
        icon: X,
    },
};

const conditionConfig = {
    excelente: { label: 'Excelente', color: 'text-green-700 dark:text-green-400 font-semibold' },
    bom: { label: 'Bom', color: 'text-blue-700 dark:text-blue-400 font-semibold' },
    regular: { label: 'Regular', color: 'text-amber-700 dark:text-amber-400 font-semibold' },
    ruim: { label: 'Ruim', color: 'text-red-700 dark:text-red-400 font-semibold' },
};

export function DeviceCard({
    deviceId,
    status = 'disponivel',
    lastUsed,
    condition = 'bom',
    onRemove,
    variant = 'loan',
    showDetails = true,
    className,
    style,
}: DeviceCardProps) {
    const statusInfo = statusConfig[status] || statusConfig.disponivel;
    const conditionKey = condition && typeof condition === 'string' ? condition.toLowerCase() : 'bom';
    const conditionInfo = conditionConfig[conditionKey as keyof typeof conditionConfig] || conditionConfig.bom;
    const StatusIcon = statusInfo.icon;

    const borderColor = variant === 'loan'
        ? 'border-l-amber-600 dark:border-l-amber-500'
        : 'border-l-blue-600 dark:border-l-blue-500';

    return (
        <GlassCard
            className={cn(
                "group relative overflow-hidden transition-all duration-300",
                "hover:shadow-xl hover:-translate-y-0.5",
                "border-l-4 border-2",
                "border-gray-300 dark:border-border/40",
                borderColor,
                "animate-in slide-in-from-left-2 fade-in duration-300",
                "bg-white dark:bg-card/50",
                className
            )}
            style={style}
        >
            {/* Background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative p-3">
                <div className="flex items-center justify-between gap-3">
                    {/* Left side - Icon and ID */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn(
                            "p-2 rounded-lg transition-all duration-300",
                            "bg-gradient-to-br from-amber-200 to-amber-100",
                            "dark:from-amber-500/10 dark:to-amber-500/5",
                            "group-hover:from-amber-300 group-hover:to-amber-200",
                            "dark:group-hover:from-amber-500/20 dark:group-hover:to-amber-500/10",
                            "group-hover:scale-110",
                            "border-2 border-amber-300 dark:border-amber-500/20"
                        )}>
                            <Computer className="h-5 w-5 text-amber-800 dark:text-amber-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-base truncate text-gray-900 dark:text-foreground group-hover:text-primary transition-colors">
                                {deviceId}
                            </p>

                            {showDetails && (
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[10px] h-5 px-2 font-semibold border-2",
                                            statusInfo.color
                                        )}
                                    >
                                        <StatusIcon className="h-3 w-3 mr-1" />
                                        {statusInfo.label}
                                    </Badge>

                                    {condition && (
                                        <span className={cn("text-[10px]", conditionInfo.color)}>
                                            {conditionInfo.label}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side - Details and Remove button */}
                    <div className="flex items-center gap-2 shrink-0">
                        {showDetails && lastUsed && (
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] text-gray-600 dark:text-muted-foreground font-semibold">Último uso</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-foreground">{lastUsed}</p>
                            </div>
                        )}

                        {onRemove && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onRemove}
                                className={cn(
                                    "h-8 w-8 p-0 opacity-0 group-hover:opacity-100",
                                    "transition-all duration-300",
                                    "hover:bg-red-100 hover:text-red-700",
                                    "dark:hover:bg-destructive/20 dark:hover:text-destructive",
                                    "border-2 border-transparent hover:border-red-300 dark:hover:border-destructive/30"
                                )}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
