import Link from "next/link";
import { guard } from "../../../lib/guard";
import { query } from "../../../lib/db";
import { guildMembersMap, nameOf } from "../../../lib/discord";
import { fmt } from "../../../lib/format";

export default async function Overview({ params }) {
  const { guildId } = await params;
  await guard(guildId);
  const week = Math.floor(Date.now() / 1000) - 7 * 86400;
  const one = (sql, args = [guildId]) => query(sql, args).then((r) => r.rows[0]);
  const [s, chain, cases, weekCases, openT, allT, cmds, lv, tc, recentCases, recentTickets, names] = await Promise.all([
    one("SELECT * FROM settings WHERE guild_id=$1").then((r) => r || {}),
    one("SELECT COUNT(*)::int AS n FROM chain WHERE guild_id=$1"),
    one("SELECT COUNT(*)::int AS n FROM cases WHERE guild_id=$1"),
    one("SELECT COUNT(*)::int AS n FROM cases WHERE guild_id=$1 AND created>$2", [guildId, week]),
    one("SELECT COUNT(*)::int AS n FROM tickets WHERE guild_id=$1 AND closed IS NULL"),
    one("SELECT COUNT(*)::int AS n FROM tickets WHERE guild_id=$1"),
    one("SELECT COUNT(*)::int AS n FROM custom_commands WHERE guild_id=$1"),
    one("SELECT COUNT(*)::int AS members, COALESCE(SUM(messages),0)::int AS messages FROM levels WHERE guild_id=$1"),
    one("SELECT category_id, staff_role_id, panel_channel_id FROM ticket_config WHERE guild_id=$1").then((r) => r || {}),
    query("SELECT case_no, action, user_id, reason, created FROM cases WHERE guild_id=$1 ORDER BY case_no DESC LIMIT 5", [guildId]),
    query("SELECT category_label, owner_id, created, closed FROM tickets WHERE guild_id=$1 ORDER BY created DESC LIMIT 5", [guildId]),
    guildMembersMap(guildId),
  ]);
  const base = `/dashboard/${guildId}`;
  const todo = [
    ["Log channel", !!s.log_channel, "general"],
    ["Appeal link", !!s.appeal_link, "general"],
    ["Verification (channel and role)", !!(s.verify_channel && s.verify_role), "general"],
    ["Chain of command", chain.n > 0, "chain"],
    ["Staff announcement channel", !!s.staff_channel, "staff"],
    ["Tickets (category, staff role, panel channel)", !!(tc.category_id && tc.staff_role_id && tc.panel_channel_id), "tickets"],
  ];
  const stats = [
    [openT.n, "Open tickets"], [allT.n, "Tickets total"], [cases.n, "Cases"], [weekCases.n, "Cases this week"],
    [cmds.n, "Custom commands"], [lv.members, "Ranked members"], [lv.messages, "Messages counted"],
  ];
  return (
    <>
      <div className="stats">
        {stats.map(([v, l]) => <div className="stat" key={l}><b>{v}</b><span>{l}</span></div>)}
      </div>
      <div className="card">
        <h2>Setup checklist</h2>
        {todo.map(([label, done, tab]) => (
          <div className="todo" key={label}>
            <span className={done ? "ok" : "no"}>{done ? "Done" : "Missing"} - {label}</span>
            {!done ? <Link href={`${base}/${tab}`} className="muted">Set up</Link> : null}
          </div>
        ))}
      </div>
      <div className="card">
        <h2>Latest cases</h2>
        <div className="wrap"><table><tbody>
          {recentCases.rows.map((c) => (
            <tr key={c.case_no}><td>#{c.case_no}</td><td><span className="tag">{c.action}</span></td>
              <td>{nameOf(names, c.user_id)}</td><td>{c.reason}</td><td>{fmt(c.created)}</td></tr>
          ))}
        </tbody></table>
        {!recentCases.rows.length ? <p className="muted">No cases yet.</p> : null}</div>
        <p><Link href={`${base}/cases`} className="muted">All cases</Link></p>
      </div>
      <div className="card">
        <h2>Latest tickets</h2>
        <div className="wrap"><table><tbody>
          {recentTickets.rows.map((t, i) => (
            <tr key={i}><td>{t.category_label}</td><td>{nameOf(names, t.owner_id)}</td>
              <td><span className="tag">{t.closed ? "closed" : "open"}</span></td><td>{fmt(t.created)}</td></tr>
          ))}
        </tbody></table>
        {!recentTickets.rows.length ? <p className="muted">No tickets yet.</p> : null}</div>
        <p><Link href={`${base}/tickets`} className="muted">Manage tickets</Link></p>
      </div>
    </>
  );
}
