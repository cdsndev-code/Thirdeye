import { requireGuild } from "../../../../../lib/session";
import { guildRoles } from "../../../../../lib/discord";
import { query } from "../../../../../lib/db";

const bad = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req, { params }) {
  const { guildId } = await params;
  if (!(await requireGuild(guildId))) return bad("Forbidden", 403);
  const b = await req.json().catch(() => null);
  const rank = Number(b?.rank);
  if (!Number.isInteger(rank) || rank < 1 || rank > 100) return bad("Rank must be 1-100");
  const roles = await guildRoles(guildId);
  if (!roles.some((r) => r.id === String(b?.role_id))) return bad("Unknown role");
  await query(
    `INSERT INTO chain (guild_id, role_id, rank) VALUES ($1,$2,$3)
     ON CONFLICT (guild_id, role_id) DO UPDATE SET rank=$3`,
    [guildId, String(b.role_id), rank]
  );
  return Response.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const { guildId } = await params;
  if (!(await requireGuild(guildId))) return bad("Forbidden", 403);
  const b = await req.json().catch(() => null);
  if (!/^\d{17,20}$/.test(String(b?.role_id))) return bad("Invalid role");
  await query("DELETE FROM chain WHERE guild_id=$1 AND role_id=$2", [guildId, String(b.role_id)]);
  return Response.json({ ok: true });
}
