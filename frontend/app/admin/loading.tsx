export default function AdminLoading() {
  return (
    <div className="grid min-h-screen bg-[#f2f2f2] lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-[rgba(160,183,164,0.16)] bg-[#fbfbfa] px-4 py-5 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="grid gap-2 border-b border-[rgba(160,183,164,0.16)] pb-4">
          <div className="text-[0.72rem] uppercase tracking-[0.14em] text-[#8da693]">
            Dear Career
          </div>
          <h1 className="text-[0.92rem] font-semibold uppercase tracking-[0.08em] text-foreground">
            Loading workspace
          </h1>
          <p className="text-[0.88rem] text-[#727975]">Preparing dashboard data.</p>
        </div>
      </aside>
      <main className="px-4 py-6 lg:px-7 lg:py-8">
        <div className="grid max-w-[980px] gap-5">
          <header className="grid gap-2">
            <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Admin</div>
            <h1 className="text-[clamp(1.7rem,2.4vw,2.2rem)] font-semibold leading-none text-foreground">
              Loading dashboard
            </h1>
          </header>
          <section className="grid gap-3 md:grid-cols-3">
            <article className="min-h-[136px] rounded-[18px] border border-[rgba(160,183,164,0.16)] bg-[linear-gradient(90deg,rgba(255,255,255,0.6),rgba(245,247,244,0.92),rgba(255,255,255,0.6))] bg-[length:200%_100%] animate-[adminSkeletonPulse_1.4s_ease-in-out_infinite]" />
            <article className="min-h-[136px] rounded-[18px] border border-[rgba(160,183,164,0.16)] bg-[linear-gradient(90deg,rgba(255,255,255,0.6),rgba(245,247,244,0.92),rgba(255,255,255,0.6))] bg-[length:200%_100%] animate-[adminSkeletonPulse_1.4s_ease-in-out_infinite]" />
            <article className="min-h-[136px] rounded-[18px] border border-[rgba(160,183,164,0.16)] bg-[linear-gradient(90deg,rgba(255,255,255,0.6),rgba(245,247,244,0.92),rgba(255,255,255,0.6))] bg-[length:200%_100%] animate-[adminSkeletonPulse_1.4s_ease-in-out_infinite]" />
          </section>
        </div>
      </main>
    </div>
  );
}
