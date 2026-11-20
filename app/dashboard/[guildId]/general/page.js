import { guard } from "../../../../lib/guard";
import { query } from "../../../../lib/db";
import { guildChannels, guildRoles } from "../../../../lib/discord";
import SettingsForm from "../../../../components/SettingsForm";
import VerifyPanelButton from "../../../../components/VerifyPanelButton";

export default async function General({ params }) {
  const { guildId } = await params;
  await guard(guildId);
  const [settings, channels, roles] = await Promise.all([
    query("SELECT * FROM settings WHERE guild_id=$1", [guildId]), guildChannels(guildId), guildRoles(guildId),
  ]);
  const row = settings.rows[0] || {};
  const initial = {
    log_channel: row.log_channel ?? null, appeal_link: row.appeal_link ?? "",
    antispam: row.antispam ?? 1, antiraid: row.antiraid ?? 1,
    verify_channel: row.verify_channel ?? null, verify_role: row.verify_role ?? null,
  };
  return (
    <div className="card">
      <h2>General and verification</h2>
      <SettingsForm guildId={guildId} initial={initial} channels={channels} roles={roles} />
      <VerifyPanelButton guildId={guildId} />
    </div>
  );
}
