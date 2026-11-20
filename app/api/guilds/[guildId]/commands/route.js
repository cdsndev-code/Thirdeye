import { requireGuild } from "../../../../../lib/session";
import { query } from "../../../../../lib/db";

const bad = (error, status = 400) => Response.json({ error }, { status });
const RESERVED = ["guide", "status"];

export async function POST(req, { params }) {
  const { guildId } = await params;
  const s = await requireGuild(guildId);
  if (!s) return bad("Forbidden", 403);
  const b = await req.json().catch(() => null);

  const name = String(b?.name || "").trim().toLowerCase().replace(/^!/, "");
  const response = String(b?.response || "").trim();
  if (!/^[a-z0-9_-]{1,32}$/.test(name) || RESERVED.includes(name))
    return bad("Invalid name: use letters, numbers, - and _ (guide and status are reserved)");
  if (!response || response.length > 1500) return bad("The reply must be 1-1500 characters");

  const exists = await query("SELECT 1 FROM custom_commands WHERE guild_id=$1 AND name=$2", [guildId, name]);
  if (!exists.rows.length) {
    const c = await query("SELECT COUNT(*)::int AS n FROM custom_commands WHERE guild_id=$1", [guildId]);
    if (c.rows[0].n >= 50) return bad("Limit of 50 commands reached");
  }
  await query(
    `INSERT INTO custom_commands (guild_id, name, response, as_embed, created_by, created)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (guild_id, name) DO UPDATE SET response=$3, as_embed=$4`,
    [guildId, name, response, b.as_embed ? 1 : 0, s.uid, Math.floor(Date.now() / 1000)]
  );
  return Response.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const { guildId } = await params;
  if (!(await requireGuild(guildId))) return bad("Forbidden", 403);
  const b = await req.json().catch(() => null);
  const name = String(b?.name || "").toLowerCase();
  if (!/^[a-z0-9_-]{1,32}$/.test(name)) return bad("Invalid name");
  await query("DELETE FROM custom_commands WHERE guild_id=$1 AND name=$2", [guildId, name]);
  return Response.json({ ok: true });
}
