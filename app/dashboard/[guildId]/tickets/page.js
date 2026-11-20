import { guard } from "../../../../lib/guard";
import { botGuilds, guildChannels, guildRoles, guildCategories, guildMembersMap, nameOf } from "../../../../lib/discord";
import { query } from "../../../../lib/db";
import { loadTicketData } from "../../../../lib/ticketsDb";
import { fmt } from "../../../../lib/format";
import TicketsEditor from "../../../../components/TicketsEditor";
import TicketControl from "../../../../components/TicketControl";

export default async function TicketsPage({ params }) {
  const { guildId } = await params;
  await guard(guildId);
  const [data, open, recent, guilds, channels, roles, discordCategories, names] = await Promise.all([
    loadTicketData(guildId),
    query("SELECT channel_id, owner_id, claimed_by, category_label, created FROM tickets WHERE guild_id=$1 AND closed IS NULL ORDER BY created DESC", [guildId]),
    query("SELECT owner_id, claimed_by, category_label, created, closed, close_reason FROM tickets WHERE guild_id=$1 AND closed IS NOT NULL ORDER BY closed DESC LIMIT 30", [guildId]),
    botGuilds(), guildChannels(guildId), guildRoles(guildId), guildCategories(guildId), guildMembersMap(guildId),
  ]);
  const guildName = guilds.find((g) => g.id === guildId)?.name || "your server";
  const openRows = open.rows.map((t) => ({
    channel_id: String(t.channel_id), category: t.category_label, owner: nameOf(names, t.owner_id),
    claimed: t.claimed_by ? nameOf(names, t.claimed_by) : "-", created: fmt(t.created),
  }));
  return (
    <>
      <div className="card">
        <h2>Open tickets</h2>
        <TicketControl guildId={guildId} tickets={openRows} />
      </div>
      <TicketsEditor guildId={guildId} guildName={guildName} initial={data} channels={channels}
        roles={roles} discordCategories={discordCategories} />
      <div className="card">
        <h2>Closed tickets</h2>
        <div className="wrap"><table>
          <thead><tr><th>Category</th><th>Opened by</th><th>Claimed by</th><th>Opened</th><th>Closed</th><th>Reason</th></tr></thead>
          <tbody>
            {recent.rows.map((t, i) => (
              <tr key={i}><td>{t.category_label}</td><td>{nameOf(names, t.owner_id)}</td>
                <td>{t.claimed_by ? nameOf(names, t.claimed_by) : "-"}</td><td>{fmt(t.created)}</td>
                <td>{fmt(t.closed)}</td><td>{t.close_reason || "-"}</td></tr>
            ))}
          </tbody>
        </table>
        {!recent.rows.length ? <p className="muted">No closed tickets yet.</p> : null}</div>
      </div>
    </>
  );
}
