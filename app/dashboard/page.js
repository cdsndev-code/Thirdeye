import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../lib/session";
import { botGuilds, INVITE } from "../../lib/discord";

export default async function Dashboard() {
  const s = await getSession();
  if (!s) redirect("/");
  const mine = (await botGuilds()).filter((g) => s.guilds.includes(g.id));
  return (
    <>
      <h1>Your servers</h1>
      {mine.length ? (
        <div className="grid">
          {mine.map((g) => (
            <Link key={g.id} href={`/dashboard/${g.id}`} className="card guild">
              {g.icon ? <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64`} alt="" /> : <div className="ph" />}
              <span>{g.name}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="muted">No servers found where you are an administrator and the bot is present.</p>
      )}
      <div className="row">
        <a className="btn" href="/api/auth/login?refresh=1">Refresh servers</a>
        <a className="btn ghost" href={INVITE}>Add the bot to a server</a>
      </div>
      <p className="muted">Just added the bot or created a new server? Press Refresh servers.</p>
    </>
  );
}
