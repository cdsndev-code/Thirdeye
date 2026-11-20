import { guard } from "../../../../lib/guard";
import { query } from "../../../../lib/db";
import CommandsEditor from "../../../../components/CommandsEditor";
import { BOT_COMMANDS } from "../../../../lib/botCommands";

export default async function Commands({ params }) {
  const { guildId } = await params;
  await guard(guildId);
  const cmds = await query("SELECT name, response, as_embed FROM custom_commands WHERE guild_id=$1 ORDER BY name", [guildId]);
  return (
    <>
      <div className="card">
        <h2>Custom commands</h2>
        <CommandsEditor guildId={guildId} commands={cmds.rows} />
      </div>
      <div className="card">
        <h2>Bot commands</h2>
        {BOT_COMMANDS.map(([group, list]) => (
          <div key={group}>
            <h3 style={{ marginBottom: 6 }}>{group}</h3>
            <div className="wrap"><table><tbody>
              {list.map(([cmd, desc, who]) => (
                <tr key={cmd}><td><code>{cmd}</code></td><td>{desc}</td><td className="muted">{who}</td></tr>
              ))}
            </tbody></table></div>
          </div>
        ))}
      </div>
    </>
  );
}
