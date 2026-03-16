import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

export function Container({ as: Comp = "div", className, ...props }: ContainerProps) {
  return <Comp className={cn("app-container", className)} {...props} />;
}
