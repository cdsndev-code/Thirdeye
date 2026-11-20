import { query } from "./db";
import { DEFAULT_TEXTS, DEFAULT_CATEGORIES } from "./tickets";

export async function loadTicketData(guildId) {
  const [cfg, cats, texts] = await Promise.all([
    query("SELECT * FROM ticket_config WHERE guild_id=$1", [guildId]),
    query("SELECT label, description FROM ticket_categories WHERE guild_id=$1 ORDER BY position, label", [guildId]),
    query("SELECT key, value FROM ticket_texts WHERE guild_id=$1", [guildId]),
  ]);
  const c = cfg.rows[0] || {};
  return {
    config: {
      category_id: c.category_id ?? null,
      staff_role_id: c.staff_role_id ?? null,
      panel_channel_id: c.panel_channel_id ?? null,
      panel_message_id: c.panel_message_id ?? null,
      max_open: c.max_open ?? 1,
      close_delay: c.close_delay ?? 5,
      dm_enabled: c.dm_enabled ?? 1,
      enabled: c.enabled ?? 1,
    },
    categories: cats.rows.length
      ? cats.rows.map((r) => ({ label: r.label, description: r.description || "" }))
      : DEFAULT_CATEGORIES,
    texts: {
      ...DEFAULT_TEXTS,
      ...Object.fromEntries(texts.rows.filter((r) => r.key in DEFAULT_TEXTS && r.value).map((r) => [r.key, r.value])),
    },
  };
}
