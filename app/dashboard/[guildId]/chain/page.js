import { guard } from "../../../../lib/guard";
import { query } from "../../../../lib/db";
import { guildRoles } from "../../../../lib/discord";
import ChainEditor from "../../../../components/ChainEditor";

export default async function Chain({ params }) {
  const { guildId } = await params;
  await guard(guildId);
  const [chain, roles] = await Promise.all([
    query("SELECT role_id, rank FROM chain WHERE guild_id=$1 ORDER BY rank DESC", [guildId]), guildRoles(guildId),
  ]);
  const names = Object.fromEntries(roles.map((r) => [r.id, r.name]));
  const rows = chain.rows.map((c) => ({ role_id: c.role_id, rank: c.rank, name: names[c.role_id] || `Deleted role ${c.role_id}` }));
  return (
    <div className="card">
      <h2>Chain of command</h2>
      <ChainEditor guildId={guildId} chain={rows} roles={roles} />
    </div>
  );
}
