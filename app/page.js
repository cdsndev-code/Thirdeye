import Link from "next/link";
import { getSession } from "../lib/session";
import { INVITE } from "../lib/discord";
import Logo from "../components/Logo";

const FEATURES = [
  ["Anti-spam", "Message floods are deleted and muted automatically, and every action becomes a case."],
  ["Webhook protection", "Spamming webhooks are deleted on the spot and their creator is banned."],
  ["Anti-raid", "Mass joins are detected and kicked before they can do damage."],
  ["Captcha verification", "New members solve an image captcha before they get access to the server."],
  ["Cases and logs", "Every punishment is stored, logged in your channel and sent to the user with your appeal link."],
  ["Chain of command", "Rank your staff roles so moderators can only punish people below them."],
  ["Custom commands", "Create your own !commands with plain text or embed replies."],
  ["Web dashboard", "Change settings, review cases and edit the bot profile from any device."],
];

const STEPS = [
  ["1", "Add the bot", "Invite Third Eye Protection to your server with the button above."],
  ["2", "Run /setup", "One command opens a private panel for logs, verification, chain and protection."],
  ["3", "Fine-tune online", "Log in here to manage everything and read your case history."],
];

export default async function Home({ searchParams }) {
  const s = await getSession();
  const sp = await searchParams;
  return (
    <>
      <section className="hero">
        <Logo />
        <h1>Third eye <span style={{ color: "var(--red)" }}>protection</span></h1>
        <p>Level up your security. Anti-spam, anti-raid, captcha verification and full case history for your Discord server.</p>
        {sp?.error ? <p>Login failed. Please try again.</p> : null}
        <div className="row">
          {s ? (
            <Link className="btn" href="/dashboard">Open dashboard</Link>
          ) : (
            <a className="btn" href="/api/auth/login">Log in with Discord</a>
          )}
          <a className="btn ghost" href={INVITE}>Add to Discord</a>
        </div>
      </section>

      <section className="features">
        {FEATURES.map(([t, d]) => (
          <div className="feat" key={t}><h3>{t}</h3><p>{d}</p></div>
        ))}
      </section>

      <h2>How it works</h2>
      <section className="steps">
        {STEPS.map(([n, t, d]) => (
          <div className="feat step" key={n}><b>{n}</b><h3 style={{ margin: "4px 0" }}>{t}</h3><p>{d}</p></div>
        ))}
      </section>

      <footer>Third eye protection</footer>
    </>
  );
}
