import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const navLinkClass = ({ isActive }) =>
  [
    "rounded-full px-3 py-1 text-sm font-medium transition",
    isActive ? "bg-primary/20 text-navy" : "text-navy/80 hover:bg-primary/10 hover:text-navy",
  ].join(" ");

export default function Shell({ children }) {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-[calc(100dvh-3rem)]">
      <header className="mb-8 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-frost backdrop-blur">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-navy text-ice">
            P
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Pingoo</div>
            <div className="text-xs text-navy/70">Learn to code, one bite at a time</div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink to="/courses" className={navLinkClass}>
            Courses
          </NavLink>
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-navy/70 sm:inline">
                {user?.display_name || user?.username || "Penguin"}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full bg-navy px-3 py-1 text-sm font-semibold text-ice hover:bg-navy/90"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Login
              </NavLink>
              <NavLink to="/signup" className={navLinkClass}>
                Signup
              </NavLink>
            </>
          )}
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}
