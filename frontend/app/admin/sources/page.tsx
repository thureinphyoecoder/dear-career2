import { FetchSettingsForm } from "@/components/admin/FetchSettingsForm";
import { getFetchSettings } from "@/lib/api-admin";

export default async function AdminSourcesPage() {
  const settings = await getFetchSettings();

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <div className="stack">
          <div className="eyebrow">Fetch settings</div>
          <h1 className="admin-page-title">Source intake and sync rules</h1>
          <p className="admin-page-copy">
            Configure cadence in minutes or hours, decide which sites are fetchable, and keep manual URL intake available when scraping is not possible.
          </p>
        </div>
      </header>
      <FetchSettingsForm initialSettings={settings} />
    </div>
  );
}
