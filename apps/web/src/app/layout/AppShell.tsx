import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { LanguageSwitcher, LogoutButton } from "@/modules/auth";
import { useShoppingListCount } from "@/modules/shopping";
import { m } from "@/shared/i18n";

const navLinkClass = "whitespace-nowrap py-2 text-ink-muted transition-colors hover:text-ink";
const activeNavLink = {
  className: "whitespace-nowrap py-2 text-ink underline decoration-accent underline-offset-8",
};

export function AppShell() {
  const router = useRouter();
  const shoppingCount = useShoppingListCount();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5">
      {/*
        Wide screens: name, navigation and sign out on one line.
        Narrow screens: name and sign out first, navigation on its own line,
        scrolling sideways rather than breaking its labels.
      */}
      <header className="flex flex-wrap items-center gap-x-8 gap-y-1 border-b border-line py-4">
        <Link to="/" className="font-display text-2xl">
          {m.app_name()}
        </Link>
        <nav className="order-last flex min-w-0 basis-full gap-6 overflow-x-auto sm:order-none sm:flex-1 sm:basis-auto">
          <Link
            to="/"
            className={navLinkClass}
            activeProps={activeNavLink}
            activeOptions={{ exact: true, includeSearch: false }}
          >
            {m.nav_matches()}
          </Link>
          <Link to="/cocktails" className={navLinkClass} activeProps={activeNavLink}>
            {m.nav_catalog()}
          </Link>
          <Link to="/pantry" className={navLinkClass} activeProps={activeNavLink}>
            {m.nav_pantry()}
          </Link>
          <Link to="/shopping" className={navLinkClass} activeProps={activeNavLink}>
            {m.nav_shopping()}
            {shoppingCount ? (
              <span className="ml-1.5 text-accent tabular-nums">{shoppingCount}</span>
            ) : null}
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher saveToAccount />
          <LogoutButton onLoggedOut={() => void router.navigate({ to: "/login" })} />
        </div>
      </header>
      <main className="flex-1 py-10">
        <Outlet />
      </main>
    </div>
  );
}
