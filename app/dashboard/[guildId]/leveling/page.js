import { guard } from "../../../../lib/guard";
import { query } from "../../../../lib/db";
import { guildChannels, guildRoles, guildMembersMap, nameOf } from "../../../../lib/discord";
import { levelFromXp } from "../../../../lib/leveling";
import LevelingEditor from "../../../../components/LevelingEditor";

export default async function Leveling({ params }) {
  const { guildId } = await params;
  await guard(guildId);
  const [settings, rewards, top, channels, roles, names] = await Promise.all([
    query("SELECT level_enabled, level_channel FROM settings WHERE guild_id=$1", [guildId]),
    query("SELECT level, role_id FROM level_rewards WHERE guild_id=$1 ORDER BY level", [guildId]),
    query("SELECT user_id, xp, messages FROM levels WHERE guild_id=$1 ORDER BY xp DESC LIMIT 25", [guildId]),
    guildChannels(guildId), guildRoles(guildId), guildMembersMap(guildId),
  ]);
  const s = settings.rows[0] || {};
  const initial = {
    config: { level_enabled: s.level_enabled ?? 1, level_channel: s.level_channel ?? null },
    rewards: rewards.rows.map((r) => ({ level: r.level, role_id: String(r.role_id) })),
  };
  return (
    <>
      <div className="card">
        <h2>Rank system</h2>
        <LevelingEditor guildId={guildId} channels={channels} roles={roles} initial={initial} />
      </div>
      <div className="card">
        <h2>Leaderboard</h2>
        <div className="wrap"><table>
          <thead><tr><th>#</th><th>Member</th><th>Level</th><th>XP</th><th>Messages</th></tr></thead>
          <tbody>
            {top.rows.map((r, i) => (
              <tr key={r.user_id}><td>{i + 1}</td><td>{nameOf(names, r.user_id)}</td><td>{levelFromXp(r.xp)}</td>
                <td>{Number(r.xp).toLocaleString("en-US")}</td><td>{Number(r.messages).toLocaleString("en-US")}</td></tr>
            ))}
          </tbody>
        </table>
        {!top.rows.length ? <p className="muted">Nobody has earned XP yet.</p> : null}</div>
      </div>
    </>
  );
}
