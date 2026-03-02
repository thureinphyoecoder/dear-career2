import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AdCardProps = {
  title: string;
  eyebrow?: string;
  description: string;
  ctaLabel: string;
  href: string;
  compact?: boolean;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  ctaClassName?: string;
  showHeaderBadges?: boolean;
  showFooterBadges?: boolean;
};

export function AdCard({
  title,
  eyebrow = "Sponsored",
  description,
  ctaLabel,
  href,
  compact = false,
  className,
  contentClassName,
  titleClassName,
  descriptionClassName,
  ctaClassName,
  showHeaderBadges = true,
  showFooterBadges = true,
}: AdCardProps) {
  return (
    <Card
      className={cn(
        "h-full border-0 bg-[linear-gradient(145deg,rgba(255,247,240,0.94),rgba(221,232,223,0.72))]",
        compact && "min-h-0",
        className,
      )}
    >
      <CardContent className={cn("flex h-full flex-col gap-3 p-6", contentClassName)}>
        {showHeaderBadges ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="outline">{eyebrow}</Badge>
            <Badge>featured</Badge>
          </div>
        ) : null}
        <div className="grid gap-2">
          <CardTitle className={titleClassName}>{title}</CardTitle>
          <p className={cn("mb-0 text-sm leading-6 text-[#727975]", descriptionClassName)}>
            {description}
          </p>
        </div>
        {showFooterBadges ? (
          <div className="mt-auto flex flex-wrap gap-2">
            <Badge variant="secondary">Priority placement</Badge>
            <Badge variant="secondary">Brand spotlight</Badge>
          </div>
        ) : null}
        <a
          href={href}
          className={cn(
            buttonVariants({ variant: "secondary" }),
            showFooterBadges ? "mt-2" : "mt-auto",
            "self-start",
            ctaClassName,
          )}
        >
          {ctaLabel}
        </a>
      </CardContent>
    </Card>
  );
}
