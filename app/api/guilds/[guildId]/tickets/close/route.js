import { requireGuild } from "../../../../../../lib/session";
import { query } from "../../../../../../lib/db";
import { botGuilds, sendChannelMessage, dmUser, deleteChannel } from "../../../../../../lib/discord";
import { loadTicketData } from "../../../../../../lib/ticketsDb";
import { fill, colorInt } from "../../../../../../lib/tickets";

const bad = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req, { params }) {
  const { guildId } = await params;
  const s = await requireGuild(guildId);
  if (!s) return bad("Forbidden", 403);
  const b = await req.json().catch(() => null);
  const channelId = String(b?.channel_id || "");
  if (!/^\d{17,20}$/.test(channelId)) return bad("Invalid ticket");
  const reason = String(b?.reason || "").trim().slice(0, 500) || "Closed from the dashboard";

  const t = (await query("SELECT * FROM tickets WHERE channel_id=$1 AND guild_id=$2 AND closed IS NULL", [channelId, guildId])).rows[0];
  if (!t) return bad("Ticket not found or already closed", 404);
  await query("UPDATE tickets SET closed=$2, closed_by=$3, close_reason=$4 WHERE channel_id=$1",
    [channelId, Math.floor(Date.now() / 1000), s.uid, reason]);

  const [{ config, texts }, guilds, settings] = await Promise.all([
    loadTicketData(guildId), botGuilds(), query("SELECT log_channel FROM settings WHERE guild_id=$1", [guildId]),
  ]);
  const server = (guilds.find((g) => g.id === guildId)?.name || "").replace(/`/g, "'");
  const values = {
    user: `<@${t.owner_id}>`, user_name: "", staff: `<@${s.uid}>`, staff_name: s.name || "", closer: `<@${s.uid}>`,
    category: t.category_label || "", reason: reason.replace(/`/g, "'"), channel: "", server, delay: "0", categories: "",
  };
  if (config.dm_enabled)
    await dmUser(t.owner_id, {
      embeds: [{ title: fill(texts.dm_closed_title, values).slice(0, 256), description: fill(texts.dm_closed, values).slice(0, 4096), color: colorInt(texts.close_color) }],
    });
  const log = settings.rows[0]?.log_channel;
  if (log)
    await sendChannelMessage(log, {
      embeds: [{
        title: "Ticket closed from the dashboard", color: 0xe41c3a,
        fields: [
          { name: "Category", value: t.category_label || "-", inline: true },
          { name: "Opened by", value: `<@${t.owner_id}>`, inline: true },
          { name: "Closed by", value: `<@${s.uid}>`, inline: true },
          { name: "Reason", value: reason.slice(0, 1000) },
        ],
        timestamp: new Date().toISOString(),
      }],
      allowed_mentions: { parse: [] },
    });

  const del = await deleteChannel(channelId, `Ticket closed from the dashboard: ${reason}`);
  if (!del.ok && del.status !== 404) return bad("Marked as closed, but Discord refused to delete the channel (check my Manage Channels permission)", 502);
  return Response.json({ ok: true });
}
