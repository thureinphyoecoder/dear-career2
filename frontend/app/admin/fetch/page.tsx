import { FetchSettingsForm } from "@/components/admin/FetchSettingsForm";
import { getFetchSettings } from "@/lib/api-admin";

export default async function AdminFetchPage() {
  const settings = await getFetchSettings();

  return (
    <div className="grid max-w-[1120px] gap-6">
      <header className="grid gap-2">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Fetch settings</div>
        <h1 className="text-[clamp(1.7rem,2.4vw,2.2rem)] font-semibold leading-none text-foreground">
          Fetch settings
        </h1>
        <p className="max-w-[48ch] text-[0.92rem] leading-6 text-[#727975]">
          Configure fetch cadence, run limits, and publishing approval behavior.
        </p>
      </header>
      <FetchSettingsForm initialSettings={settings} />
    </div>
  );
}
