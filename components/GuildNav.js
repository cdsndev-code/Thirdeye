"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["", "Overview"], ["general", "General"], ["chain", "Chain of command"], ["staff", "Staff"],
  ["tickets", "Tickets"], ["cases", "Cases"], ["commands", "Commands"], ["leveling", "Leveling"],
  ["profile", "Bot profile"],
];

export default function GuildNav({ guildId }) {
  const path = usePathname();
  const base = `/dashboard/${guildId}`;
  return (
    <nav className="nav">
      {ITEMS.map(([slug, label]) => {
        const href = slug ? `${base}/${slug}` : base;
        const active = slug ? path.startsWith(href) : path === base;
        return <Link key={slug} href={href} className={active ? "active" : ""}>{label}</Link>;
      })}
    </nav>
  );
}
