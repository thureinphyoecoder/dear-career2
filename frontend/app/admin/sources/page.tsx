import { FetchSettingsForm } from "@/components/admin/FetchSettingsForm";
import { getFetchSettings } from "@/lib/api-admin";

export default async function AdminSourcesPage() {
  const settings = await getFetchSettings();

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <div className="stack">
          <div className="eyebrow">Fetch settings</div>
          <h1 className="admin-page-title">Fetch settings</h1>
          <p className="admin-page-copy">
            Configure cadence, source availability, manual URL intake, and channel approval rules.
          </p>
        </div>
      </header>
      <FetchSettingsForm initialSettings={settings} />
    </div>
  );
}
