import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FetchSource } from "@/lib/types";

function formatSourceMode(source: FetchSource) {
  if (source.requires_manual_url) {
    return "Manual URL";
  }

  if (source.mode === "rss") {
    return "RSS";
  }

  return source.mode === "html" ? "HTML scraper" : "Manual";
}

export function SourceRegistry({ sources }: { sources: FetchSource[] }) {
  return (
    <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
      <CardContent className="grid gap-4 p-5">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Source registry</div>
          <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">
            Connected sources
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {sources.map((source) => (
            <article
              key={source.id}
              className="grid gap-4 rounded-[20px] border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.74)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong>{source.label}</strong>
                  <span className="block text-[0.92rem] text-[#727975]">{source.domain}</span>
                </div>
                <span
                  className={cn(
                    "inline-flex min-w-[84px] items-center justify-center rounded-full px-3 py-1 text-[0.72rem] uppercase tracking-[0.1em]",
                    source.status === "healthy" && "bg-[rgba(76,145,118,0.14)] text-[#246245]",
                    source.status === "warning" && "bg-[rgba(204,165,92,0.16)] text-[#8a6120]",
                    source.status === "paused" && "bg-[rgba(114,121,117,0.16)] text-[#59605d]",
                  )}
                >
                  {source.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-[0.92rem] text-[#727975]">
                <span>{formatSourceMode(source)}</span>
                <span>
                  {source.requires_manual_url
                    ? "Manual URL required"
                    : `Every ${source.cadence_value} ${source.cadence_unit}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={buttonVariants({ variant: "secondary" })} type="button">
                  Configure
                </button>
                <button className={buttonVariants({ variant: "secondary" })} type="button">
                  Run now
                </button>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
