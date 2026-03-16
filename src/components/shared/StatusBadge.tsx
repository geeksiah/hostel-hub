import { cn } from '@/lib/utils';
import type { BookingStatus, PaymentStatus, TicketStatus } from '@/types';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-light text-emerald border-emerald/15',
  warning: 'bg-amber-light text-amber border-amber/15',
  error: 'bg-destructive/10 text-destructive border-destructive/15',
  info: 'bg-primary/8 text-primary border-primary/10',
  neutral: 'bg-muted/70 text-muted-foreground border-border/80',
};

function getBookingVariant(status: BookingStatus): BadgeVariant {
  switch (status) {
    case 'confirmed': case 'checked_in': return 'success';
    case 'pending': case 'reserved': return 'warning';
    case 'cancelled': case 'checked_out': return 'neutral';
    default: return 'neutral';
  }
}

function getPaymentVariant(status: PaymentStatus): BadgeVariant {
  switch (status) {
    case 'completed': case 'verified': return 'success';
    case 'pending': return 'warning';
    case 'failed': return 'error';
    default: return 'neutral';
  }
}

function getTicketVariant(status: TicketStatus): BadgeVariant {
  switch (status) {
    case 'open': return 'warning';
    case 'assigned': return 'info';
    case 'resolved': return 'success';
    case 'closed': return 'neutral';
    default: return 'neutral';
  }
}

interface StatusBadgeProps {
  status: string;
  type?: 'booking' | 'payment' | 'ticket' | 'custom';
  variant?: BadgeVariant;
  className?: string;
}

export function StatusBadge({ status, type = 'custom', variant, className }: StatusBadgeProps) {
  let resolved = variant ?? 'neutral';
  if (!variant) {
    if (type === 'booking') resolved = getBookingVariant(status as BookingStatus);
    else if (type === 'payment') resolved = getPaymentVariant(status as PaymentStatus);
    else if (type === 'ticket') resolved = getTicketVariant(status as TicketStatus);
  }

  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium capitalize',
      variantClasses[resolved],
      className,
    )}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
