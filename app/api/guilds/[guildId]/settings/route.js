import { requireGuild } from "../../../../../lib/session";
import { guildChannels, guildRoles } from "../../../../../lib/discord";
import { query } from "../../../../../lib/db";

const bad = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req, { params }) {
  const { guildId } = await params;
  if (!(await requireGuild(guildId))) return bad("Forbidden", 403);

  const b = await req.json().catch(() => null);
  if (!b) return bad("Invalid body");
  const [channels, roles] = await Promise.all([guildChannels(guildId), guildRoles(guildId)]);

  const pick = (val, list) => {
    if (!val) return null;
    return list.some((x) => x.id === String(val)) ? String(val) : undefined;
  };
  const log_channel = pick(b.log_channel, channels);
  const verify_channel = pick(b.verify_channel, channels);
  const verify_role = pick(b.verify_role, roles);
  if ([log_channel, verify_channel, verify_role].includes(undefined)) return bad("Unknown channel or role");

  const appeal = String(b.appeal_link || "").trim();
  if (appeal && (!/^https?:\/\//i.test(appeal) || appeal.length > 300)) return bad("Invalid appeal link");

  await query(
    `INSERT INTO settings (guild_id, log_channel, appeal_link, antispam, antiraid, verify_channel, verify_role)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (guild_id) DO UPDATE SET
       log_channel=$2, appeal_link=$3, antispam=$4, antiraid=$5, verify_channel=$6, verify_role=$7`,
    [guildId, log_channel, appeal || null, b.antispam ? 1 : 0, b.antiraid ? 1 : 0, verify_channel, verify_role]
  );
  return Response.json({ ok: true });
}
