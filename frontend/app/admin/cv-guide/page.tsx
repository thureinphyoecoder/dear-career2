import { CvGuideEditor } from "@/components/admin/CvGuideEditor";
import { getAdminCvGuideContent } from "@/lib/api-admin";

export default async function AdminCvGuidePage() {
  const content = await getAdminCvGuideContent();

  return (
    <div className="grid max-w-none gap-6 xl:pr-6">
      <CvGuideEditor initialContent={content} />
    </div>
  );
}
