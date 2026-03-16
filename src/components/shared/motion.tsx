import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const motionEase = [0.22, 1, 0.36, 1] as const;

export const motionTransitions = {
  page: { duration: 0.26, ease: motionEase },
  section: { duration: 0.34, ease: motionEase },
  pop: { duration: 0.2, ease: motionEase },
} as const;

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`${location.pathname}${location.search}`}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
        transition={motionTransitions.page}
        className={cn("will-change-transform", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface RevealTransitionProps {
  children: ReactNode;
  show: boolean;
  className?: string;
}

export function RevealTransition({ children, show, className }: RevealTransitionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8, height: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, height: "auto" }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, height: 0 }}
          transition={motionTransitions.pop}
          className={cn("overflow-hidden", className)}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
