export const EMOJI = {
  shield: "<:te_shield:1572736181026693131>", success: "<:te_success:1572736693688209418>",
  warn: "<:te_warn:1572735913140691124>", error: "<:te_error:1572736733181649057>",
};
export const STAFF_KINDS = { promote: "Promotion", demote: "Demotion", warn: "Warning", dismiss: "Dismissal" };
export const BRAND = "Third Eye Protection";

export function fill(text, values) {
  let t = String(text ?? "");
  for (const [k, v] of Object.entries(values)) t = t.split(`{${k}}`).join(v);
  return t;
}
export const colorHex = (n) => "#" + Number(n).toString(16).padStart(6, "0");
export const colorInt = (hex) => {
  const n = parseInt(String(hex).replace("#", ""), 16);
  return Number.isNaN(n) ? 0x5865f2 : n;
};

// Same defaults as default_template() in the bot: values are shown in `inline code`
export function defaultTemplate(kind) {
  const icon = { promote: "success", demote: "warn", warn: "warn", dismiss: "error" }[kind];
  const color = { promote: 0x57f287, demote: 0xf0883e, warn: 0xfee75c, dismiss: 0xed4245 }[kind];
  const member = "**Member**\n`{user_name}`\n\n";
  const ranks = "**Previous rank**\n`{old_role}`\n\n**New rank**\n`{new_role}`\n\n";
  const warns = "**Warnings**\n`{warns}/{limit}`\n\n";
  const tail = "**Reason**\n`{reason}`\n\n**By**\n`{mod_name}`";
  const description = { promote: member + ranks + tail, demote: member + ranks + tail, warn: member + warns + tail, dismiss: member + tail }[kind];
  return { title: `${EMOJI[icon]} ${STAFF_KINDS[kind]}`, description, color, footer: BRAND, image_url: null };
}

export function renderEmbed(tpl, values) {
  const e = {
    title: fill(tpl.title, values).slice(0, 256) || undefined,
    description: fill(tpl.description, values).slice(0, 4096),
    color: tpl.color,
    timestamp: new Date().toISOString(),
  };
  if (tpl.footer) e.footer = { text: fill(tpl.footer, values).slice(0, 2048) };
  if (tpl.image_url) e.image = { url: tpl.image_url };
  return e;
}

export function staffValues({ guildName, modMention, modName, member, reason, oldRole = "None", newRole = "None", warns = 0, limit = 3 }) {
  const c = (t) => String(t).replace(/`/g, "'");
  const name = member.nick || member.user.global_name || member.user.username;
  return {
    user: `<@${member.user.id}>`, user_name: c(name), mod: modMention || BRAND, mod_name: c(modName || BRAND),
    reason: c(reason), old_role: c(oldRole), new_role: c(newRole), warns: String(warns), limit: String(limit),
    date: new Date().toISOString().slice(0, 10), server: c(guildName),
  };
}
