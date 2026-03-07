"use client";

import { Building2, ImageOff } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

function buildInitials(title: string, company?: string) {
  const source = company?.trim() || title.trim();
  if (!source) {
    return "DC";
  }

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function PublicJobImage({
  src,
  title,
  company,
  alt,
  wrapperClassName,
  imageClassName,
  fallbackClassName,
}: {
  src?: string;
  title: string;
  company?: string;
  alt?: string;
  wrapperClassName?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const initials = useMemo(() => buildInitials(title, company), [company, title]);
  const shouldRenderImage = Boolean(src && !hasError);

  return (
    <div className={cn("overflow-hidden", wrapperClassName)}>
      {shouldRenderImage ? (
        <img
          src={src}
          alt={alt || title}
          className={imageClassName}
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <div
          className={cn(
            "grid w-full place-items-center bg-[linear-gradient(145deg,rgba(244,249,243,0.96),rgba(231,240,232,0.92))] text-[#5f7365]",
            fallbackClassName,
          )}
          aria-label={alt || title}
          role="img"
        >
          <div className="grid justify-items-center gap-2 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(116,141,122,0.2)] bg-white/70 text-lg font-semibold tracking-[0.12em] text-[#47604e]">
              {initials}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[0.78rem] font-medium uppercase tracking-[0.14em] text-[#6d8172]">
              <Building2 className="h-3.5 w-3.5" />
              {company || "Dear Career"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[0.78rem] text-[#7a847e]">
              <ImageOff className="h-3.5 w-3.5" />
              Image unavailable
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
