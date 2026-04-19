export default function AppNav({
  current,
}: {
  current: "leads" | "contacts" | "reports";
}) {
  const linkCls = (active: boolean) =>
    active
      ? "text-text font-semibold border-b-2 border-brand-accent pb-2"
      : "text-text-muted hover:text-text pb-2";

  return (
    <header className="flex items-center justify-between mb-6 border-b border-border">
      <nav className="flex items-center gap-6">
        <h1 className="text-xl font-semibold text-text pb-2">Vive CRM</h1>
        <a href="/leads" className={linkCls(current === "leads")}>
          Pipeline
        </a>
        <a href="/contacts" className={linkCls(current === "contacts")}>
          Contacts
        </a>
        <a href="/reports" className={linkCls(current === "reports")}>
          Reports
        </a>
      </nav>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="text-sm text-text-muted hover:text-text pb-2"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}
