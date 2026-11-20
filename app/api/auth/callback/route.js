import { NextResponse } from "next/server";
import { createSession } from "../../../../lib/session";
import { isAdminGuild } from "../../../../lib/discord";

const fail = () => NextResponse.redirect(new URL("/?error=1", process.env.BASE_URL));

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const code = q.get("code");
  const state = q.get("state");
  const silent = req.cookies.get("te_silent")?.value === "1";
  if (q.get("error") && silent && state === req.cookies.get("te_state")?.value) {
    // silent refresh was not possible: fall back to the normal login screen
    const back = NextResponse.redirect(new URL("/api/auth/login", process.env.BASE_URL));
    back.cookies.delete("te_silent");
    return back;
  }
  if (!code || !state || state !== req.cookies.get("te_state")?.value) return fail();

  const tok = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.BASE_URL}/api/auth/callback`,
    }),
  });
  if (!tok.ok) return fail();
  const { access_token } = await tok.json();

  const h = { Authorization: `Bearer ${access_token}` };
  const [me, guilds] = await Promise.all([
    fetch("https://discord.com/api/v10/users/@me", { headers: h }).then((r) => r.json()),
    fetch("https://discord.com/api/v10/users/@me/guilds", { headers: h }).then((r) => r.json()),
  ]);
  if (!me?.id || !Array.isArray(guilds)) return fail();

  const jwt = await createSession({
    uid: me.id,
    name: me.global_name || me.username,
    guilds: guilds.filter(isAdminGuild).map((g) => g.id).slice(0, 80),
  });
  const res = NextResponse.redirect(new URL("/dashboard", process.env.BASE_URL));
  res.cookies.set("te_session", jwt, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 8 * 3600,
    secure: process.env.NODE_ENV === "production",
  });
  res.cookies.delete("te_state");
  res.cookies.delete("te_silent");
  return res;
}
