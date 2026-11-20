import { requireGuild } from "../../../../../lib/session";
import { guildChannels, guildRoles, guildCategories } from "../../../../../lib/discord";
import { getClient } from "../../../../../lib/db";
import { DEFAULT_TEXTS, TEXT_LIMITS, HEX, slug } from "../../../../../lib/tickets";

const bad = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req, { params }) {
  const { guildId } = await params;
  if (!(await requireGuild(guildId))) return bad("Forbidden", 403);
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") return bad("Invalid body");

  const [channels, roles, cats] = await Promise.all([
    guildChannels(guildId), guildRoles(guildId), guildCategories(guildId),
  ]);
  const pick = (v, list) => (!v ? null : list.some((x) => x.id === String(v)) ? String(v) : undefined);
  const c = b.config || {};
  const category_id = pick(c.category_id, cats);
  const staff_role_id = pick(c.staff_role_id, roles);
  const panel_channel_id = pick(c.panel_channel_id, channels);
  if ([category_id, staff_role_id, panel_channel_id].includes(undefined))
    return bad("Unknown category, role or channel");
  const maxOpen = Number(c.max_open);
  const delay = Number(c.close_delay);
  if (!Number.isInteger(maxOpen) || maxOpen < 1 || maxOpen > 10) return bad("Max open tickets must be 1-10");
  if (!Number.isInteger(delay) || delay < 0 || delay > 60) return bad("Close delay must be 0-60 seconds");

  const list = Array.isArray(b.categories) ? b.categories : [];
  if (list.length > 25) return bad("Up to 25 categories");
  const cleanCats = [];
  const used = new Set();
  for (const [i, x] of list.entries()) {
    const label = String(x?.label || "").trim();
    const description = String(x?.description || "").trim();
    if (!label || label.length > 80 || description.length > 100)
      return bad("Each category needs a label (max 80) and a description of up to 100 characters");
    let key = slug(label);
    let n = 2;
    while (used.has(key)) key = `${slug(label)}-${n++}`;
    used.add(key);
    cleanCats.push({ key, label, description, position: i });
  }

  const texts = b.texts && typeof b.texts === "object" ? b.texts : {};
  const rows = [];
  for (const [k, lim] of Object.entries(TEXT_LIMITS)) {
    const v = String(texts[k] ?? "").trim();
    if (!v || v === DEFAULT_TEXTS[k]) continue; // empty or default = use the built-in text
    if (v.length > lim.max) return bad(`"${k}" is too long (max ${lim.max})`);
    if (lim.kind === "color" && !HEX.test(v)) return bad("Colors must look like #5865F2");
    rows.push([k, v]);
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO ticket_config (guild_id, category_id, staff_role_id, panel_channel_id, max_open, close_delay, dm_enabled, enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (guild_id) DO UPDATE SET category_id=$2, staff_role_id=$3, panel_channel_id=$4,
         max_open=$5, close_delay=$6, dm_enabled=$7, enabled=$8`,
      [guildId, category_id, staff_role_id, panel_channel_id, maxOpen, delay, c.dm_enabled ? 1 : 0, c.enabled ? 1 : 0]
    );
    await client.query("DELETE FROM ticket_categories WHERE guild_id=$1", [guildId]);
    for (const x of cleanCats)
      await client.query(
        "INSERT INTO ticket_categories (guild_id, key, label, description, position) VALUES ($1,$2,$3,$4,$5)",
        [guildId, x.key, x.label, x.description, x.position]
      );
    await client.query("DELETE FROM ticket_texts WHERE guild_id=$1", [guildId]);
    for (const [k, v] of rows)
      await client.query("INSERT INTO ticket_texts (guild_id, key, value) VALUES ($1,$2,$3)", [guildId, k, v]);
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK").catch(() => {});
    return bad("Database error. Has the bot been restarted so the ticket tables exist?", 500);
  } finally {
    client.release();
  }
  return Response.json({ ok: true });
}
