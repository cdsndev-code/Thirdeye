import { requireGuild } from "../../../../../../lib/session";
import { query } from "../../../../../../lib/db";
import { sendChannelMessage } from "../../../../../../lib/discord";
import { EMOJI } from "../../../../../../lib/staff";

const bad = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req, { params }) {
  const { guildId } = await params;
  if (!(await requireGuild(guildId))) return bad("Forbidden", 403);
  const s = (await query("SELECT verify_channel, verify_role FROM settings WHERE guild_id=$1", [guildId])).rows[0];
  if (!s?.verify_channel || !s?.verify_role) return bad("Choose and save the verification channel and the verified role first");
  const res = await sendChannelMessage(s.verify_channel, {
    embeds: [{
      title: `${EMOJI.shield} Verification`,
      description: "Press the button below and solve the captcha to gain access to the server.",
      color: 0x5865f2,
    }],
    components: [{ type: 1, components: [{ type: 2, style: 3, label: "Verify", custom_id: "te:verify" }] }],
    allowed_mentions: { parse: [] },
  });
  if (!res.ok) {
    const t = await res.json().catch(() => ({}));
    return bad(t.message || "Discord refused the message. Check my permissions in that channel.", 502);
  }
  return Response.json({ ok: true });
}
