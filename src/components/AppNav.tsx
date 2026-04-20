import Link from "next/link";
import Logo from "./Logo";

export default function AppNav({
  current,
}: {
  current: "leads" | "contacts" | "reports" | "settings" | "calendar";
}) {
  const linkCls = (active: boolean) =>
    active
      ? "text-text font-semibold border-b-2 border-brand-accent pb-2"
      : "text-text-muted hover:text-text pb-2 border-b-2 border-transparent";

  return (
    <header className="flex items-center justify-between mb-6 border-b border-border">
      <nav className="flex items-center gap-6">
        <Link href="/leads" className="pb-2 flex items-center">
          <Logo size={32} />
        </Link>
        <a href="/leads" className={linkCls(current === "leads")}>
          Pipeline
        </a>
        <a href="/contacts" className={linkCls(current === "contacts")}>
          Contacts
        </a>
        <a href="/calendar" className={linkCls(current === "calendar")}>
          Calendar
        </a>
        <a href="/reports" className={linkCls(current === "reports")}>
          Reports
        </a>
        <a href="/settings" className={linkCls(current === "settings")}>
          Settings
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
