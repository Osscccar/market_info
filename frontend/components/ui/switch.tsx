"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const switchTrackStyles = cva(
  // Base classes for the track
  "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors " +
    "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 " +
    // Colors for checked/unchecked
    "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-neutral-700 border-transparent"
);

const switchThumbStyles = cva(
  // Base classes for the thumb
  "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform " +
    // Position for checked/unchecked
    "data-[state=checked]:translate-x-[20px] data-[state=unchecked]:translate-x-0"
);

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>((props, ref) => {
  return (
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(switchTrackStyles())}
      {...props}
    >
      <SwitchPrimitives.Thumb className={cn(switchThumbStyles())} />
    </SwitchPrimitives.Root>
  );
});

Switch.displayName = "Switch";

export { Switch };
