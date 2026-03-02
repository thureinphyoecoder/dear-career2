import Link from "next/link";
import type { CSSProperties } from "react";
import { SproutMark } from "@/components/public/SproutMark";
import { cn } from "@/lib/utils";

export function BrandLogo({
  compact = false,
  className,
  inline = false,
  href = "/",
}: {
  compact?: boolean;
  className?: string;
  inline?: boolean;
  href?: string;
}) {
  const textStyle = {
    fontSize: compact ? "clamp(2.1rem, 5vw, 3rem)" : "clamp(3.2rem, 7vw, 5.5rem)",
    lineHeight: compact ? 0.9 : 0.86,
  } satisfies CSSProperties;

  const logo = (
    <div
      className={cn(
        "inline-flex items-center gap-4 text-[#454c49]",
        compact && "gap-2.5",
        className,
      )}
    >
      <SproutMark
        className={cn(
          "h-auto shrink-0",
          inline ? "w-16" : compact ? "w-[72px]" : "w-40",
          className?.includes("nav-brand-logo") && "w-16",
          className?.includes("admin-brand-logo") && "w-[92px]",
        )}
      />
      <div className={cn("grid items-end", inline && "flex items-center")}>
        <div
          className={cn(
            "grid font-serif font-normal leading-[0.8] tracking-[-0.045em]",
            inline && "flex items-baseline gap-[0.08em] leading-none",
          )}
          style={textStyle}
        >
          <span
            className={cn(
              "block italic font-medium opacity-95",
              inline
                ? "inline-block translate-y-[-0.08em] text-[0.72em] tracking-[-0.055em]"
                : "translate-x-[0.08em] text-[0.8em] tracking-[-0.05em]",
            )}
          >
            dear
          </span>
          <span
            className={cn(
              inline ? "inline-block text-[1em] tracking-[-0.085em]" : "block text-[1em] tracking-[-0.075em]",
            )}
          >
            career
          </span>
        </div>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="inline-flex">
      {logo}
    </Link>
  ) : (
    logo
  );
}
