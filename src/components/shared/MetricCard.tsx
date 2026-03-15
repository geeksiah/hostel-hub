import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "emerald" | "amber" | "navy";
  className?: string;
}

const variantStyles = {
  default: "bg-card border",
  emerald: "bg-emerald-light border-emerald/20",
  amber: "bg-amber-light border-amber/20",
  navy: "bg-primary text-primary-foreground",
};

export function MetricCard({ title, value, subtitle, icon: Icon, trend, variant = "default", className }: MetricCardProps) {
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-lg p-4 sm:p-5", variantStyles[variant], className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className={cn("text-xs font-medium uppercase tracking-wider", variant === "navy" ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {title}
          </p>
          <p className="break-words font-display text-xl font-bold leading-tight sm:text-2xl">{value}</p>
          {subtitle ? (
            <p className={cn("break-words text-xs", variant === "navy" ? "text-primary-foreground/60" : "text-muted-foreground")}>
              {subtitle}
            </p>
          ) : null}
          {trend ? (
            <p className={cn("break-words text-xs font-medium", trend.value >= 0 ? "text-emerald" : "text-destructive")}>
              {trend.value >= 0 ? "Up" : "Down"} {Math.abs(trend.value)}% {trend.label}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <div className={cn("shrink-0 rounded-lg p-2", variant === "navy" ? "bg-primary-foreground/10" : "bg-muted")}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
