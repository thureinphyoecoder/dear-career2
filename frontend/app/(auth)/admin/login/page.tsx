type AdminLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    redirect?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid: "Invalid username or password.",
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
          <div className="eyebrow">Secure Admin Access</div>
          <h1 className="section-title">Sign in to Dear Career admin</h1>
          <p className="public-footer-copy">
            Use the protected dashboard credentials. Django admin login remains
            available on the backend admin route.
          </p>
        </div>

        <form
          className="admin-auth-form"
          action="/api/admin/session/login"
          method="post"
        >
          <input type="hidden" name="redirect" value={redirectTo} />
          <label className="stack">
            <span className="eyebrow">Username</span>
            <input
              className="field"
              type="text"
              name="username"
              autoComplete="username"
              required
            />
          </label>
          <label className="stack">
            <span className="eyebrow">Password</span>
            <input
              className="field"
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="admin-auth-error">{error}</p> : null}
          <button type="submit" className="button admin-auth-submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
