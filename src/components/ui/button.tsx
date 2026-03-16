import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium ring-offset-background transition-[transform,background-color,border-color,box-shadow,color,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-px active:translate-y-0 active:scale-[0.985] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_20px_rgba(22,163,74,0.18)] hover:bg-secondary/92",
        destructive: "bg-destructive text-destructive-foreground shadow-[0_8px_20px_rgba(220,38,38,0.16)] hover:bg-destructive/92",
        outline: "border border-border bg-card text-foreground shadow-[0_1px_2px_rgba(16,24,40,0.03)] hover:bg-muted/70",
        secondary: "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(15,23,42,0.10)] hover:bg-primary/92",
        ghost: "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        link: "rounded-none px-0 text-secondary underline-offset-4 hover:underline",
        emerald: "bg-secondary text-secondary-foreground shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_20px_rgba(22,163,74,0.18)] hover:bg-secondary/92",
        amber: "bg-amber-light text-amber shadow-[0_1px_2px_rgba(16,24,40,0.03)] hover:bg-amber-light/80",
        hero: "bg-secondary text-secondary-foreground shadow-[0_14px_30px_rgba(22,163,74,0.24)] hover:bg-secondary/92",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3.5 text-[13px]",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
