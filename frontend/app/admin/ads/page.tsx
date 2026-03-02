import { AdsManager } from "@/components/admin/AdsManager";
import { getManagedAds } from "@/lib/api-admin";

export default async function AdminAdsPage() {
  const ads = await getManagedAds();

  return (
    <div className="grid max-w-none gap-6 xl:pr-6">
      <AdsManager initialAds={ads} />
    </div>
  );
}
