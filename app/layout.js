import "./globals.css";
import Link from "next/link";
import { getSession } from "../lib/session";

export const metadata = { title: "Third Eye Protection" };

export default async function RootLayout({ children }) {
  const s = await getSession();
  return (
    <html lang="en">
      <body>
        <header>
          <Link href="/" className="brand">Third eye <b>protection</b></Link>
          {s ? (
            <span className="row muted">
              {s.name} <a className="btn ghost" href="/api/auth/logout">Log out</a>
            </span>
          ) : null}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
