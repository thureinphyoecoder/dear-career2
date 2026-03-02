import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { BrandLogo } from "@/components/public/BrandLogo";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    redirect?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid: "",
  config: "Admin auth is not configured yet. Set the admin env values first.",
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = (await searchParams) ?? {};
  const error = params.error ? errorMessages[params.error] : "";
  const redirectTo = params.redirect?.startsWith("/admin")
    ? params.redirect
    : "/admin";

  return (
    <main className="grid min-h-screen place-items-center bg-[#f2f2f2] px-4 py-8">
      <section className="grid w-full max-w-[440px] gap-5 rounded-[28px] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.78)] p-6 shadow-soft backdrop-blur-xl">
        <div className="grid gap-3">
          <BrandLogo compact inline className="nav-brand-logo" />
          <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Admin</div>
          <h1 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-normal leading-[1.05] text-foreground">
            Dear Career Login
          </h1>
        </div>
        <AdminLoginForm redirectTo={redirectTo} error={error} />
      </section>
    </main>
  );
}
