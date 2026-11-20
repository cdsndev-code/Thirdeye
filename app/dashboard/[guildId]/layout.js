import Link from "next/link";
import { notFound } from "next/navigation";
import { guard } from "../../../lib/guard";
import { botGuilds } from "../../../lib/discord";
import GuildNav from "../../../components/GuildNav";

export default async function GuildLayout({ children, params }) {
  const { guildId } = await params;
  await guard(guildId);
  const guild = (await botGuilds()).find((g) => g.id === guildId);
  if (!guild) notFound();
  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        {guild.icon ? <img className="pfp" src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`} alt="" /> : <div className="pfp" />}
        <div>
          <h1 style={{ margin: 0 }}>{guild.name}</h1>
          <Link href="/dashboard" className="muted">All servers</Link>
        </div>
      </div>
      <div className="shell">
        <GuildNav guildId={guildId} />
        <div className="content">{children}</div>
      </div>
    </>
  );
}
