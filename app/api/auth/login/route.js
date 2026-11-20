import { NextResponse } from "next/server";

export async function GET(req) {
  const refresh = new URL(req.url).searchParams.get("refresh") === "1";
  const state = crypto.randomUUID();
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify guilds");
  url.searchParams.set("redirect_uri", `${process.env.BASE_URL}/api/auth/callback`);
  url.searchParams.set("state", state);
  if (refresh) url.searchParams.set("prompt", "none");
  const res = NextResponse.redirect(url);
  res.cookies.set("te_state", state, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  if (refresh) {
    res.cookies.set("te_silent", "1", {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 600,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}
