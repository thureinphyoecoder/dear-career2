import { SourceRegistry } from "@/components/admin/SourceRegistry";
import { getFetchSettings } from "@/lib/api-admin";

export default async function AdminSourcesPage() {
  const settings = await getFetchSettings();

  return (
    <div className="grid max-w-none gap-6 xl:pr-6">
      <SourceRegistry sources={settings.sources} />
    </div>
  );
}
