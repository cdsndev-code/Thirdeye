import { requireGuild } from "../../../../../lib/session";
import { guildChannels, guildRoles } from "../../../../../lib/discord";
import { getClient } from "../../../../../lib/db";

const bad = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req, { params }) {
  const { guildId } = await params;
  if (!(await requireGuild(guildId))) return bad("Forbidden", 403);
  const b = await req.json().catch(() => null);
  if (!b) return bad("Invalid body");
  const [channels, roles] = await Promise.all([guildChannels(guildId), guildRoles(guildId)]);

  const channel = b.config?.level_channel ? String(b.config.level_channel) : null;
  if (channel && !channels.some((c) => c.id === channel)) return bad("Unknown channel");
  const rewards = [];
  const seen = new Set();
  for (const r of Array.isArray(b.rewards) ? b.rewards : []) {
    const level = Number(r.level);
    const role = String(r.role_id || "");
    if (!Number.isInteger(level) || level < 1 || level > 500) return bad("Reward levels must be 1-500");
    if (!roles.some((x) => x.id === role)) return bad("Unknown reward role");
    if (seen.has(level)) return bad(`Level ${level} has more than one reward`);
    seen.add(level);
    rewards.push([level, role]);
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO settings (guild_id, level_enabled, level_channel) VALUES ($1,$2,$3)
       ON CONFLICT (guild_id) DO UPDATE SET level_enabled=$2, level_channel=$3`,
      [guildId, b.config?.level_enabled ? 1 : 0, channel]
    );
    await client.query("DELETE FROM level_rewards WHERE guild_id=$1", [guildId]);
    for (const [level, role] of rewards)
      await client.query("INSERT INTO level_rewards (guild_id, level, role_id) VALUES ($1,$2,$3)", [guildId, level, role]);
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK").catch(() => {});
    return bad("Database error", 500);
  } finally {
    client.release();
  }
  return Response.json({ ok: true });
}
