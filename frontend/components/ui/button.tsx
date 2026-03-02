import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border border-[#748d7a]/40 bg-gradient-to-br from-[#8da693] to-[#748d7a] text-[#fffaf3] hover:-translate-y-0.5 hover:from-[#7d9883] hover:to-[#6d8572]",
        secondary:
          "border border-[rgba(160,183,164,0.24)] bg-[rgba(255,247,240,0.92)] text-foreground hover:-translate-y-0.5 hover:bg-[rgba(255,250,245,0.98)]",
        ghost:
          "text-foreground hover:bg-[rgba(160,183,164,0.12)]",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        lg: "h-14 px-6 text-base",
        sm: "h-9 px-4",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
