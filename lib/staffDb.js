import { query } from "./db";
import {
  fetchMember, addRole, removeRole, sendChannelMessage, dmUser, botGuilds, guildRolesAll, discordError,
} from "./discord";
import { STAFF_KINDS, defaultTemplate, renderEmbed, staffValues } from "./staff";

export async function getTemplate(guildId, kind) {
  const base = defaultTemplate(kind);
  const row = (await query("SELECT * FROM embed_templates WHERE guild_id=$1 AND kind=$2", [guildId, kind])).rows[0];
  if (!row) return base;
  return {
    title: row.title || base.title, description: row.description || base.description,
    color: row.color ?? base.color, footer: row.footer ?? base.footer, image_url: row.image_url || null,
  };
}

export async function newEntry(guildId, userId, modId, action, reason, oldRole = "", newRole = "") {
  for (let i = 0; i < 5; i++) {
    try {
      const r = await query(
        `INSERT INTO staff_log (guild_id, entry_no, user_id, mod_id, action, reason, old_role, new_role, created)
         SELECT $1::bigint, COALESCE(MAX(entry_no),0)+1, $2::bigint, $3::bigint, $4::text, $5::text, $6::text, $7::text, $8::bigint
         FROM staff_log WHERE guild_id=$1::bigint RETURNING entry_no`,
        [guildId, userId, modId, action, reason, oldRole, newRole, Math.floor(Date.now() / 1000)]
      );
      return r.rows[0].entry_no;
    } catch (e) {
      if (e.code !== "23505") throw e;
    }
  }
  throw new Error("Could not allocate an entry number");
}

const countWarns = async (guildId, userId) =>
  (await query(
    `SELECT COUNT(*)::int AS n FROM staff_log WHERE guild_id=$1 AND user_id=$2 AND action='warn' AND entry_no >
     COALESCE((SELECT MAX(entry_no) FROM staff_log WHERE guild_id=$1 AND user_id=$2 AND action IN ('dismiss','clear')), 0)`,
    [guildId, userId]
  )).rows[0].n;

// Runs one staff action from the website (mirrors apply_staff in the bot)
export async function applyStaff({ guildId, actor, kind, memberId, roleId, reason, depth = 0 }) {
  const err = (error) => ({ ok: false, error });
  const member = await fetchMember(guildId, memberId);
  if (!member) return err("Member not found in this server.");
  if (member.user.bot) return err("Bots cannot be staff members.");

  const [settingsR, chainR, roles, guilds] = await Promise.all([
    query("SELECT staff_channel, log_channel, warn_limit FROM settings WHERE guild_id=$1", [guildId]),
    query("SELECT role_id, rank FROM chain WHERE guild_id=$1", [guildId]),
    guildRolesAll(guildId), botGuilds(),
  ]);
  const st = settingsR.rows[0] || {};
  const limit = st.warn_limit || 3;
  const chain = Object.fromEntries(chainR.rows.map((r) => [String(r.role_id), r.rank]));
  const names = Object.fromEntries(roles.map((r) => [r.id, r.name]));
  const held = member.roles.filter((r) => r in chain);
  const heldRank = Math.max(0, ...held.map((r) => chain[r]));
  const why = `${STAFF_KINDS[kind]} - ${reason}`;
  let oldRole = "None", newRole = "None";

  if (kind === "promote" || kind === "demote") {
    if (!roleId || !(roleId in chain)) return err("That role is not in the chain of command. Add it on the Chain of command tab first.");
    if (member.roles.includes(roleId)) return err("The member already has that role.");
    const newRank = chain[roleId];
    if (kind === "promote" && newRank <= heldRank) return err("A promotion must go to a higher rank than the member has now.");
    if (kind === "demote" && (!held.length || newRank >= heldRank)) return err("A demotion must go to a lower rank than the member has now.");
    const drop = held.filter((r) => (kind === "promote" ? chain[r] < newRank : chain[r] > newRank));
    const add = await addRole(guildId, memberId, roleId, why);
    if (!add.ok) return err(await discordError(add));
    for (const id of drop) await removeRole(guildId, memberId, id, why);
    oldRole = drop.map((id) => names[id] || id).join(", ") || "None";
    newRole = names[roleId] || roleId;
  } else if (kind === "dismiss") {
    for (const id of held) await removeRole(guildId, memberId, id, why);
    oldRole = held.map((id) => names[id] || id).join(", ") || "None";
  }

  const modId = actor?.uid || process.env.DISCORD_CLIENT_ID;
  await newEntry(guildId, memberId, modId, kind, reason, oldRole, newRole);
  const warns = kind === "warn" ? await countWarns(guildId, memberId) : 0;
  const values = staffValues({
    guildName: guilds.find((g) => g.id === guildId)?.name || "", modMention: actor ? `<@${actor.uid}>` : null,
    modName: actor?.name, member, reason, oldRole, newRole, warns, limit,
  });
  const embed = renderEmbed(await getTemplate(guildId, kind), values);

  const channelId = st.staff_channel || st.log_channel;
  let announced = false;
  if (channelId) {
    const r = await sendChannelMessage(channelId, {
      content: `<@${memberId}>`, embeds: [embed], allowed_mentions: { users: [String(memberId)] },
    });
    announced = r.ok;
  }
  await dmUser(memberId, { embeds: [embed] });

  if (kind === "warn" && warns >= limit && depth === 0) {
    await applyStaff({ guildId, actor: null, kind: "dismiss", memberId, roleId: null, reason: `Reached ${limit} staff warnings`, depth: 1 });
    return { ok: true, message: `Warning ${warns}/${limit} recorded. The limit was reached, so the member was dismissed.` };
  }
  return {
    ok: true,
    message: `${STAFF_KINDS[kind]} recorded${announced ? " and announced" : ". No staff or log channel is set, so nothing was announced"}.`,
  };
}
