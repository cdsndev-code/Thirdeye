import { guard } from "../../../../lib/guard";
import { query } from "../../../../lib/db";
import { guildChannels, guildRolesAll, guildMembersMap, nameOf } from "../../../../lib/discord";
import { getTemplate } from "../../../../lib/staffDb";
import { STAFF_KINDS, defaultTemplate, colorHex } from "../../../../lib/staff";
import { fmt } from "../../../../lib/format";
import StaffPanel from "../../../../components/StaffPanel";
import StaffSettings from "../../../../components/StaffSettings";

const plain = (t) => ({ title: t.title, description: t.description, color: colorHex(t.color), footer: t.footer || "", image_url: t.image_url || "" });

export default async function Staff({ params }) {
  const { guildId } = await params;
  await guard(guildId);
  const kinds = Object.keys(STAFF_KINDS);
  const [settings, chain, history, warns, channels, roles, names, ...tpls] = await Promise.all([
    query("SELECT staff_channel, warn_limit FROM settings WHERE guild_id=$1", [guildId]),
    query("SELECT role_id, rank FROM chain WHERE guild_id=$1 ORDER BY rank DESC", [guildId]),
    query("SELECT entry_no, user_id, mod_id, action, reason, old_role, new_role, created FROM staff_log WHERE guild_id=$1 ORDER BY entry_no DESC LIMIT 30", [guildId]),
    query(
      `SELECT l.user_id, COUNT(*)::int AS warns FROM staff_log l WHERE l.guild_id=$1 AND l.action='warn' AND l.entry_no >
       COALESCE((SELECT MAX(entry_no) FROM staff_log WHERE guild_id=$1 AND user_id=l.user_id AND action IN ('dismiss','clear')),0)
       GROUP BY l.user_id ORDER BY warns DESC LIMIT 20`, [guildId]),
    guildChannels(guildId), guildRolesAll(guildId), guildMembersMap(guildId),
    ...kinds.map((k) => getTemplate(guildId, k)),
  ]);
  const st = settings.rows[0] || {};
  const limit = st.warn_limit || 3;
  const roleNames = Object.fromEntries(roles.map((r) => [r.id, r.name]));
  const chainRoles = chain.rows.map((c) => ({ id: c.role_id, name: roleNames[c.role_id] || c.role_id, rank: c.rank }));
  const templates = Object.fromEntries(kinds.map((k, i) => [k, plain(tpls[i])]));
  const defaults = Object.fromEntries(kinds.map((k) => [k, plain(defaultTemplate(k))]));
  const guildName = "your server";

  return (
    <>
      <div className="card">
        <h2>Promote, demote, warn or dismiss</h2>
        {chainRoles.length ? null : <p className="muted">Add your staff roles on the Chain of command tab first to use promotions and demotions.</p>}
        <StaffPanel guildId={guildId} chainRoles={chainRoles} limit={limit} />
      </div>
      <div className="card">
        <h2>Active warnings</h2>
        <div className="wrap"><table><tbody>
          {warns.rows.map((w) => (
            <tr key={w.user_id}><td>{nameOf(names, w.user_id)}</td><td>{w.warns}/{limit}</td></tr>
          ))}
        </tbody></table>
        {!warns.rows.length ? <p className="muted">No active staff warnings.</p> : null}</div>
      </div>
      <div className="card">
        <h2>Staff history</h2>
        <div className="wrap"><table>
          <thead><tr><th>#</th><th>Action</th><th>Member</th><th>By</th><th>Roles</th><th>Reason</th><th>Date</th></tr></thead>
          <tbody>
            {history.rows.map((h) => (
              <tr key={h.entry_no}>
                <td>#{h.entry_no}</td><td><span className="tag">{STAFF_KINDS[h.action] || h.action}</span></td>
                <td>{nameOf(names, h.user_id)}</td><td>{nameOf(names, h.mod_id)}</td>
                <td>{h.old_role || h.new_role ? `${h.old_role || "-"} to ${h.new_role || "-"}` : "-"}</td>
                <td>{h.reason}</td><td>{fmt(h.created)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!history.rows.length ? <p className="muted">No staff actions yet.</p> : null}</div>
      </div>
      <div className="card">
        <h2>Staff settings and embeds</h2>
        <StaffSettings guildId={guildId} guildName={guildName} channels={channels}
          initial={{ staff_channel: st.staff_channel ?? null, warn_limit: limit }} templates={templates} defaults={defaults} />
      </div>
    </>
  );
}
