import type { CSSProperties } from "react";
import { SproutMark } from "@/components/public/SproutMark";

export function BrandLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const textStyle = {
    fontSize: compact ? "clamp(2.1rem, 5vw, 3rem)" : "clamp(3.2rem, 7vw, 5.5rem)",
    lineHeight: compact ? 0.9 : 0.86,
  } satisfies CSSProperties;

  return (
    <div
      className={["brand-logo", compact ? "brand-logo-compact" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      <SproutMark className="brand-logo-mark" />
      <div className="brand-logo-text" style={textStyle}>
        <span>dear</span>
        <span>career</span>
      </div>
    </div>
  );
}
