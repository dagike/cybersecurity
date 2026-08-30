// Page shell shared by both apps: optional top banner, a header with nav links,
// and a centered content column. Nav links are passed in so each app controls
// its own routes.

import type { ReactNode } from "react";

export interface NavLink {
  href: string;
  label: string;
}

export interface LayoutProps {
  title: string;
  navLinks?: NavLink[];
  username?: string | null;
  onLogout?: () => void;
  banner?: ReactNode;
  children: ReactNode;
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: "12px 16px",
  borderBottom: "1px solid #e5e7eb",
};

const mainStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "24px 16px",
};

export function Layout({
  title,
  navLinks = [],
  username,
  onLogout,
  banner,
  children,
}: LayoutProps) {
  return (
    <div>
      {banner}
      <header style={headerStyle}>
        <strong style={{ fontSize: 16 }}>{title}</strong>
        <nav style={{ display: "flex", gap: 12, flex: 1 }}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        {username ? (
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span>{username}</span>
            {onLogout && (
              <button type="button" onClick={onLogout}>
                Log out
              </button>
            )}
          </span>
        ) : null}
      </header>
      <main style={mainStyle}>{children}</main>
    </div>
  );
}
