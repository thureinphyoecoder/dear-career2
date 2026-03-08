import Link from "next/link";
import type { CSSProperties } from "react";
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
  href?: string | null;
}) {
  const isAdminLogo = className?.includes("admin-brand-logo");
  const isNavLogo = className?.includes("nav-brand-logo");
  const wrapperSizeClass = isAdminLogo
    ? "w-[clamp(126px,12vw,166px)]"
    : isNavLogo
      ? "w-[clamp(138px,11vw,172px)]"
      : compact
        ? "w-[clamp(152px,15vw,210px)]"
        : "w-[clamp(190px,20vw,280px)]";
  const textStyle = {
    fontSize: isAdminLogo
      ? "clamp(1.5rem, 2.4vw, 2.1rem)"
      : compact
        ? "clamp(1.85rem, 3.2vw, 2.7rem)"
        : "clamp(2.4rem, 4vw, 3.8rem)",
    lineHeight: isAdminLogo ? 0.92 : compact ? 0.9 : 0.86,
  } satisfies CSSProperties;

  const logo = (
    <div
      className={cn(
        "inline-flex items-center gap-3.5 text-[#454c49]",
        compact && "gap-2.5",
        isAdminLogo && "gap-2",
        wrapperSizeClass,
        className,
      )}
    >
      <img src="/logoflat.svg" alt="" aria-hidden="true" className="h-auto w-[30%] shrink-0" />
      <span
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
      </span>
    </div>
  );

  return href ? (
    <Link href={href} className={cn("inline-flex", inline && "items-center")}>
      {logo}
    </Link>
  ) : (
    logo
  );
}
