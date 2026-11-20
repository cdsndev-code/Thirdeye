import { requireGuild } from "../../../../../../lib/session";
import { botGuilds, sendChannelMessage, editChannelMessage } from "../../../../../../lib/discord";
import { query } from "../../../../../../lib/db";
import { loadTicketData } from "../../../../../../lib/ticketsDb";
import { fill, colorInt } from "../../../../../../lib/tickets";

const bad = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req, { params }) {
  const { guildId } = await params;
  if (!(await requireGuild(guildId))) return bad("Forbidden", 403);
  const { config, categories, texts } = await loadTicketData(guildId);
  if (!config.panel_channel_id) return bad("Choose a panel channel and save first");

  const guild = (await botGuilds()).find((g) => g.id === guildId);
  const values = {
    user: "", user_name: "", staff: "", staff_name: "", closer: "", category: "", reason: "",
    channel: "", delay: "", server: (guild?.name || "").replace(/`/g, "'"),
    categories: categories.map((c) => `\`${c.label}\``).join("\n"),
  };
  const embed = {
    description: fill(texts.panel_description, values).slice(0, 4096),
    color: colorInt(texts.panel_color),
  };
  const title = fill(texts.panel_title, values).slice(0, 256);
  if (title) embed.title = title;
  const footer = fill(texts.panel_footer, values).slice(0, 2048);
  if (footer) embed.footer = { text: footer };
  const body = {
    embeds: [embed],
    components: [{ type: 1, components: [{ type: 2, style: 1, label: texts.panel_button.slice(0, 80), custom_id: "te_ticket_create" }] }],
    allowed_mentions: { parse: [] },
  };

  let res = null;
  if (config.panel_message_id) {
    res = await editChannelMessage(config.panel_channel_id, config.panel_message_id, body);
    if (res.status === 404) res = null; // the old panel was deleted: post a new one
  }
  if (!res) res = await sendChannelMessage(config.panel_channel_id, body);
  if (!res.ok) {
    const t = await res.json().catch(() => ({}));
    return bad(t.message || "Discord refused the message. Check my permissions in that channel.", 502);
  }
  const msg = await res.json();
  await query("UPDATE ticket_config SET panel_message_id=$2 WHERE guild_id=$1", [guildId, msg.id]);
  return Response.json({ ok: true });
}
