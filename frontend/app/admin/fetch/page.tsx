import { FetchSettingsForm } from "@/components/admin/FetchSettingsForm";
import { getFetchSettings } from "@/lib/api-admin";

export default async function AdminFetchPage() {
  const settings = await getFetchSettings();

  return (
    <div className="grid max-w-none gap-6 xl:pr-6">
      <header className="grid gap-2">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Auto import settings</div>
        <h1 className="text-[clamp(1.7rem,2.4vw,2.2rem)] font-semibold leading-none text-foreground">
          Auto import settings
        </h1>
        <p className="max-w-[48ch] text-[0.92rem] leading-6 text-[#727975]">
          Choose how often new jobs are checked, how many to bring in at once, and when a review is needed.
        </p>
      </header>
      <FetchSettingsForm initialSettings={settings} />
    </div>
  );
}
