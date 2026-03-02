import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[rgba(195,215,199,0.54)] text-foreground",
        secondary:
          "border-[rgba(160,183,164,0.14)] bg-[rgba(160,183,164,0.12)] text-foreground",
        outline:
          "border-[rgba(160,183,164,0.18)] bg-[rgba(255,246,232,0.88)] uppercase tracking-[0.18em] text-[#8da693]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
