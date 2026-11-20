import { requireGuild } from "../../../../../lib/session";
import { patchBotMember } from "../../../../../lib/discord";

const bad = (error, status = 400) => Response.json({ error }, { status });
const TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX = 3 * 1024 * 1024;

async function toDataUri(file) {
  if (!TYPES.includes(file.type)) throw new Error("Only PNG, JPG, GIF or WEBP images are allowed");
  if (file.size > MAX) throw new Error("Each image must be under 3 MB");
  return `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
}

async function apply(guildId, payload) {
  const r = await patchBotMember(guildId, payload);
  if (r.ok) return Response.json({ ok: true });
  const t = await r.json().catch(() => ({}));
  return bad(t.message || "Discord refused the change", 502);
}

export async function POST(req, { params }) {
  const { guildId } = await params;
  if (!(await requireGuild(guildId))) return bad("Forbidden", 403);
  const f = await req.formData().catch(() => null);
  if (!f) return bad("Invalid form");

  const payload = {};
  const name = String(f.get("name") || "").trim();
  if (name) {
    if (name.length > 32) return bad("Name can be at most 32 characters");
    payload.nick = name;
  }
  const bio = String(f.get("bio") || "").trim();
  if (bio) {
    if (bio.length > 190) return bad("Bio can be at most 190 characters");
    payload.bio = bio;
  }
  try {
    for (const k of ["avatar", "banner"]) {
      const file = f.get(k);
      if (file && typeof file === "object" && file.size) payload[k] = await toDataUri(file);
    }
  } catch (e) {
    return bad(e.message);
  }
  if (!Object.keys(payload).length) return bad("Nothing to change");
  return apply(guildId, payload);
}

export async function DELETE(req, { params }) {
  const { guildId } = await params;
  if (!(await requireGuild(guildId))) return bad("Forbidden", 403);
  return apply(guildId, { nick: null, avatar: null, banner: null, bio: "" });
}
