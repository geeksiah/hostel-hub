import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  variant?: 'default' | 'emerald' | 'amber' | 'navy';
  className?: string;
}

const variantStyles = {
  default: 'bg-card border',
  emerald: 'bg-emerald-light border-emerald/20',
  amber: 'bg-amber-light border-amber/20',
  navy: 'bg-primary text-primary-foreground',
};

export function MetricCard({ title, value, subtitle, icon: Icon, trend, variant = 'default', className }: MetricCardProps) {
  return (
    <div className={cn('rounded-lg p-4 sm:p-5 animate-slide-up', variantStyles[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn('text-xs font-medium uppercase tracking-wider', variant === 'navy' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
            {title}
          </p>
          <p className="text-2xl font-bold font-display">{value}</p>
          {subtitle && (
            <p className={cn('text-xs', variant === 'navy' ? 'text-primary-foreground/60' : 'text-muted-foreground')}>{subtitle}</p>
          )}
          {trend && (
            <p className={cn('text-xs font-medium', trend.value >= 0 ? 'text-emerald' : 'text-destructive')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('rounded-lg p-2', variant === 'navy' ? 'bg-primary-foreground/10' : 'bg-muted')}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
