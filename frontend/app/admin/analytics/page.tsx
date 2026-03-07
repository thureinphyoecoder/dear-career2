import { Card, CardContent } from "@/components/ui/card";
import { getVisitorSummary } from "@/lib/api-admin";

export default async function AdminAnalyticsPage() {
  const summary = await getVisitorSummary();
  const statItems = [
    ["All visitors", summary.total_visitors],
    ["Today", summary.today_visitors],
    ["Last 7 days", summary.last_7_days_visitors],
  ] as const;

  return (
    <div className="grid max-w-none gap-5 xl:pr-6">
      <section className="grid gap-4 md:grid-cols-3">
        {statItems.map(([label, value]) => (
          <Card key={label} className="rounded-2xl border-border/70 bg-white shadow-none">
            <CardContent className="grid gap-1 p-5">
              <strong className="text-[1.9rem] font-semibold leading-none text-[#334039]">{value}</strong>
              <span className="text-[0.88rem] text-[#727975]">{label}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="rounded-2xl border-border/70 bg-white shadow-none">
        <CardContent className="grid gap-0 p-0">
          {summary.top_paths.length === 0 ? (
            <p className="px-6 py-6 text-[0.92rem] text-[#727975]">No visitor activity yet.</p>
          ) : (
            summary.top_paths.map((item) => (
              <div
                key={item.path}
                className="grid gap-2 border-t border-border/60 px-6 py-4 first:border-t-0 md:grid-cols-[minmax(0,1fr)_120px_120px_180px] md:items-center"
              >
                <strong className="font-medium text-[#334039]">{item.path}</strong>
                <span className="text-sm text-[#727975]">{item.visitors} people</span>
                <span className="text-sm text-[#727975]">{item.visits} page views</span>
                <span className="text-sm text-[#727975]">
                  {item.last_seen_at ? new Date(item.last_seen_at).toLocaleString() : "No recent activity"}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
