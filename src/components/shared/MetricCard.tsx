import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "emerald" | "amber" | "navy";
  layout?: "default" | "stacked";
  className?: string;
}

const variantStyles = {
  default: "surface-card bg-card",
  emerald: "rounded-2xl border border-emerald/15 bg-emerald-light",
  amber: "rounded-2xl border border-amber/15 bg-amber-light",
  navy: "rounded-2xl border border-primary/10 bg-primary text-primary-foreground shadow-[0_10px_30px_rgba(15,23,42,0.10)]",
};

export function MetricCard({ title, value, subtitle, icon: Icon, trend, variant = "default", layout = "default", className }: MetricCardProps) {
  const titleClassName = cn(
    "text-[12px] font-medium uppercase tracking-[0.18em]",
    variant === "navy" ? "text-primary-foreground/70" : "text-muted-foreground",
  );
  const subtitleClassName = cn("break-words text-sm", variant === "navy" ? "text-primary-foreground/70" : "text-muted-foreground");
  const iconClassName = cn("shrink-0 rounded-2xl p-3", variant === "navy" ? "bg-primary-foreground/10" : "bg-background");

  return (
    <div className={cn("min-w-0 overflow-hidden p-5 sm:p-6", variantStyles[variant], className)}>
      {layout === "stacked" ? (
        <div className="space-y-3">
          <p className={titleClassName}>{title}</p>
          <div className="flex items-center justify-between gap-3">
            <p className="break-words font-display text-[1.75rem] font-semibold leading-tight">{value}</p>
            {Icon ? (
              <div className={iconClassName}>
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
          </div>
          {subtitle ? <p className={subtitleClassName}>{subtitle}</p> : null}
          {trend ? (
            <p className={cn("break-words text-xs font-medium", trend.value >= 0 ? "text-emerald" : "text-destructive")}>
              {trend.value >= 0 ? "Up" : "Down"} {Math.abs(trend.value)}% {trend.label}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <p className={titleClassName}>{title}</p>
            <p className="break-words font-display text-[1.75rem] font-semibold leading-tight">{value}</p>
            {subtitle ? <p className={subtitleClassName}>{subtitle}</p> : null}
            {trend ? (
              <p className={cn("break-words text-xs font-medium", trend.value >= 0 ? "text-emerald" : "text-destructive")}>
                {trend.value >= 0 ? "Up" : "Down"} {Math.abs(trend.value)}% {trend.label}
              </p>
            ) : null}
          </div>
          {Icon ? (
            <div className={iconClassName}>
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
