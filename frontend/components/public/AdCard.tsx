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
};

export function AdCard({
  title,
  eyebrow = "Sponsored",
  description,
  ctaLabel,
  href,
  compact = false,
}: AdCardProps) {
  return (
    <Card
      className={cn(
        "h-full border-0 bg-[linear-gradient(145deg,rgba(255,247,240,0.94),rgba(221,232,223,0.72))]",
        compact && "min-h-0",
      )}
    >
      <CardContent className="flex h-full flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="outline">{eyebrow}</Badge>
          <Badge>featured</Badge>
        </div>
        <div className="grid gap-2">
          <CardTitle>{title}</CardTitle>
          <p className="mb-0 text-sm leading-6 text-[#727975]">{description}</p>
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          <Badge variant="secondary">Priority placement</Badge>
          <Badge variant="secondary">Brand spotlight</Badge>
        </div>
        <a
          href={href}
          className={cn(buttonVariants({ variant: "secondary" }), "mt-2 self-start")}
        >
          {ctaLabel}
        </a>
      </CardContent>
    </Card>
  );
}
