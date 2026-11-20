import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const key = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function createSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(key());
}

export async function getSession() {
  const token = (await cookies()).get("te_session")?.value;
  if (!token) return null;
  try {
    return (await jwtVerify(token, key())).payload;
  } catch {
    return null;
  }
}

// Only a logged-in administrator of this server may continue.
export async function requireGuild(guildId) {
  const s = await getSession();
  if (!s || !/^\d{17,20}$/.test(guildId) || !s.guilds.includes(guildId)) return null;
  return s;
}
