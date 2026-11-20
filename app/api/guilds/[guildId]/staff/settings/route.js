import { requireGuild } from "../../../../../../lib/session";
import { guildChannels } from "../../../../../../lib/discord";
import { query } from "../../../../../../lib/db";
import { STAFF_KINDS } from "../../../../../../lib/staff";

const bad = (error, status = 400) => Response.json({ error }, { status });
const HEX = /^#[0-9a-fA-F]{6}$/;

export async function POST(req, { params }) {
  const { guildId } = await params;
  if (!(await requireGuild(guildId))) return bad("Forbidden", 403);
  const b = await req.json().catch(() => null);
  if (!b) return bad("Invalid body");

  const channels = await guildChannels(guildId);
  const channel = b.staff_channel ? String(b.staff_channel) : null;
  if (channel && !channels.some((c) => c.id === channel)) return bad("Unknown channel");
  const limit = Number(b.warn_limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) return bad("The warning limit must be 1-20");

  const rows = [];
  for (const kind of Object.keys(STAFF_KINDS)) {
    const t = b.templates?.[kind];
    if (!t) continue;
    const title = String(t.title || "").trim();
    const description = String(t.description || "").trim();
    const footer = String(t.footer || "").trim();
    const image = String(t.image_url || "").trim();
    if (title.length > 256 || description.length > 4000 || footer.length > 200 || image.length > 300) return bad(`The ${kind} embed has a field that is too long`);
    if (!HEX.test(String(t.color))) return bad("Colors must look like #57F287");
    if (image && !/^https?:\/\//i.test(image)) return bad("Image links must start with http:// or https://");
    rows.push([kind, title, description, parseInt(String(t.color).slice(1), 16), footer, image || null]);
  }

  await query(
    `INSERT INTO settings (guild_id, staff_channel, warn_limit) VALUES ($1,$2,$3)
     ON CONFLICT (guild_id) DO UPDATE SET staff_channel=$2, warn_limit=$3`,
    [guildId, channel, limit]
  );
  for (const [kind, title, description, color, footer, image] of rows)
    await query(
      `INSERT INTO embed_templates (guild_id, kind, title, description, color, footer, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (guild_id, kind) DO UPDATE SET title=$3, description=$4, color=$5, footer=$6, image_url=$7`,
      [guildId, kind, title, description, color, footer, image]
    );
  return Response.json({ ok: true });
}
