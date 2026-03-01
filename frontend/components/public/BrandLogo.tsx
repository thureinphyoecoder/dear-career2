import type { CSSProperties } from "react";
import { SproutMark } from "@/components/public/SproutMark";

export function BrandLogo({
  compact = false,
  className,
  inline = false,
}: {
  compact?: boolean;
  className?: string;
  inline?: boolean;
}) {
  const textStyle = {
    fontSize: compact ? "clamp(2.1rem, 5vw, 3rem)" : "clamp(3.2rem, 7vw, 5.5rem)",
    lineHeight: compact ? 0.9 : 0.86,
  } satisfies CSSProperties;

  return (
    <div
      className={[
        "brand-logo",
        compact ? "brand-logo-compact" : "",
        inline ? "brand-logo-inline" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <SproutMark className="brand-logo-mark" />
      <div className="brand-logo-copy">
        <div className="brand-logo-text" style={textStyle}>
          <span className="brand-logo-word brand-logo-word-dear">dear</span>
          <span className="brand-logo-word brand-logo-word-career">career</span>
        </div>
      </div>
    </div>
  );
}
