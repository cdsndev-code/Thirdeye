import Link from "next/link";
import { guard } from "../../../../lib/guard";
import { query } from "../../../../lib/db";
import { guildMembersMap, nameOf } from "../../../../lib/discord";
import { fmt } from "../../../../lib/format";

const PAGE = 25;
const ACTIONS = ["ban", "kick", "mute", "warn"];

export default async function Cases({ params, searchParams }) {
  const { guildId } = await params;
  await guard(guildId);
  const sp = await searchParams;
  const user = /^\d{17,20}$/.test(sp?.user || "") ? sp.user : null;
  const action = ACTIONS.includes(sp?.action) ? sp.action : null;
  const page = Math.max(1, parseInt(sp?.page) || 1);

  const where = ["guild_id=$1"];
  const args = [guildId];
  if (user) { args.push(user); where.push(`user_id=$${args.length}`); }
  if (action) { args.push(action); where.push(`action=$${args.length}`); }
  const w = where.join(" AND ");
  const [rows, total, names] = await Promise.all([
    query(`SELECT * FROM cases WHERE ${w} ORDER BY case_no DESC LIMIT ${PAGE} OFFSET ${(page - 1) * PAGE}`, args),
    query(`SELECT COUNT(*)::int AS n FROM cases WHERE ${w}`, args),
    guildMembersMap(guildId),
  ]);
  const pages = Math.max(1, Math.ceil(total.rows[0].n / PAGE));
  const href = (p) => {
    const q = new URLSearchParams();
    if (user) q.set("user", user);
    if (action) q.set("action", action);
    if (p > 1) q.set("page", String(p));
    return `/dashboard/${guildId}/cases${q.toString() ? "?" + q : ""}`;
  };
  return (
    <div className="card">
      <h2>Cases ({total.rows[0].n})</h2>
      <form method="get" className="row">
        <input type="text" name="user" placeholder="Filter by user ID" defaultValue={user || ""} style={{ maxWidth: 260 }} />
        <select name="action" defaultValue={action || ""} style={{ maxWidth: 160 }}>
          <option value="">All actions</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <button className="btn">Filter</button>
        {user || action ? <Link href={`/dashboard/${guildId}/cases`} className="btn ghost">Clear</Link> : null}
      </form>
      <div className="wrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th>#</th><th>Action</th><th>User</th><th>Moderator</th><th>Reason</th><th>Date</th></tr></thead>
          <tbody>
            {rows.rows.map((c) => (
              <tr key={c.case_no}>
                <td>#{c.case_no}</td><td><span className="tag">{c.action}</span></td>
                <td><Link href={`/dashboard/${guildId}/cases?user=${c.user_id}`}>{nameOf(names, c.user_id)}</Link></td>
                <td>{nameOf(names, c.mod_id)}</td><td>{c.reason}</td><td>{fmt(c.created)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.rows.length ? (
          <p className="muted">No cases yet. A case is created whenever the bot or a moderator uses /ban, /kick, /mute or /warn, or anti-spam punishes someone. If you expected cases, make sure the bot and this website use the same DATABASE_URL.</p>
        ) : null}
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        {page > 1 ? <Link href={href(page - 1)} className="btn ghost">Previous</Link> : null}
        <span className="muted">Page {page} of {pages}</span>
        {page < pages ? <Link href={href(page + 1)} className="btn ghost">Next</Link> : null}
      </div>
    </div>
  );
}
