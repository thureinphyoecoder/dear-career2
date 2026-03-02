import { ADMIN_LOGIN_MESSAGES } from "@/lib/admin-login-validation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { BrandLogo } from "@/components/public/BrandLogo";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    redirect?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid: ADMIN_LOGIN_MESSAGES.invalidCredentials,
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
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-ribbon" aria-hidden="true">
          <svg
            viewBox="0 0 400 126"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="adminLoginRibbon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a7b8aa" />
                <stop offset="45%" stopColor="#8ea291" />
                <stop offset="100%" stopColor="#71866f" />
              </linearGradient>
            </defs>
            <polygon points="0,0 400,0 400,88 200,126 0,88" fill="url(#adminLoginRibbon)" />
          </svg>
          <div className="admin-login-ribbon-content">
            <span>Admin only</span>
          </div>
        </div>
        <div className="admin-login-form-area">
          <div className="admin-login-brand">
            <BrandLogo compact inline className="admin-brand-logo" />
          </div>
          <AdminLoginForm redirectTo={redirectTo} error={error} />
        </div>
      </section>
    </main>
  );
}
