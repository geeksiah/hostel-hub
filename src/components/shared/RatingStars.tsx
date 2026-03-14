import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function RatingStars({ rating, max = 5, size = 'sm', className }: RatingStarsProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5',
            i < Math.floor(rating) ? 'fill-amber text-amber' : 'text-border',
          )}
        />
      ))}
    </div>
  );
}
