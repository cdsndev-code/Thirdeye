import { guard } from "../../../../lib/guard";
import { botMember } from "../../../../lib/discord";
import ProfileEditor from "../../../../components/ProfileEditor";

export default async function Profile({ params }) {
  const { guildId } = await params;
  await guard(guildId);
  const member = await botMember(guildId);
  const uid = member?.user?.id;
  const profile = {
    name: member?.user?.username || "",
    nick: member?.nick || "",
    avatar: member?.avatar
      ? `https://cdn.discordapp.com/guilds/${guildId}/users/${uid}/avatars/${member.avatar}.png?size=128`
      : member?.user?.avatar ? `https://cdn.discordapp.com/avatars/${uid}/${member.user.avatar}.png?size=128` : null,
  };
  return (
    <div className="card">
      <h2>Bot profile</h2>
      <ProfileEditor guildId={guildId} current={profile} />
    </div>
  );
}
