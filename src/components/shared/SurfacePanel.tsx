import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SurfacePanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function SurfacePanel({ title, description, actions, className, children, ...props }: SurfacePanelProps) {
  return (
    <section className={cn("surface-card p-5 sm:p-6", className)} {...props}>
      {(title || description || actions) ? (
        <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            {title ? <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2> : null}
            {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn(title || description || actions ? "pt-4" : "")}>{children}</div>
    </section>
  );
}
