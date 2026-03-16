import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('surface-card flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {icon && <div className="mb-4 rounded-2xl bg-muted px-3 py-3 text-muted-foreground">{icon}</div>}
      <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
