import type { ReactNode } from 'react';
import { motion, useReducedMotion } from "framer-motion";
import { motionTransitions } from "@/components/shared/motion";
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTransitions.section}
      className={cn('mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between', className)}
    >
      <div className="space-y-2">
        <h1 className="page-title">{title}</h1>
        {description ? <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
