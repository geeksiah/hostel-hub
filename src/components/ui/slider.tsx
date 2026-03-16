import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, value, defaultValue, ...props }, ref) => {
  const thumbValues = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [0];

  return (
    <SliderPrimitive.Root
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full bg-muted/90 transition-colors duration-200 ease-out">
        <SliderPrimitive.Range className="absolute h-full bg-secondary transition-[background-color] duration-200 ease-out" />
      </SliderPrimitive.Track>
      {thumbValues.map((_, index) => (
        <SliderPrimitive.Thumb
          // Radix requires a thumb per slider value for range support.
          key={index}
          className="block h-5 w-5 rounded-full border-2 border-background bg-secondary shadow-[0_4px_10px_rgba(16,24,40,0.12)] ring-offset-background transition-[box-shadow,background-color,scale] duration-150 ease-out will-change-transform hover:scale-110 hover:shadow-[0_8px_18px_rgba(16,24,40,0.16)] active:scale-[1.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
