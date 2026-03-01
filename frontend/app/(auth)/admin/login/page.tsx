import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

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
    <main className="admin-auth-page">
      <section className="admin-auth-card">
        <div className="stack">
          <div className="eyebrow">Admin</div>
          <h1 className="section-title">Dear Career Login</h1>
        </div>
        <AdminLoginForm redirectTo={redirectTo} error={error} />
      </section>
    </main>
  );
}
