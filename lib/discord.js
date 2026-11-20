const API = "https://discord.com/api/v10";
const bot = () => ({ Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` });

export const INVITE =
  `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}` +
  `&scope=bot%20applications.commands&permissions=1100384398486`;

export function isAdminGuild(g) {
  return g.owner || (BigInt(g.permissions) & 0x8n) === 0x8n;
}

async function get(path, fresh = false) {
  const r = await fetch(`${API}${path}`, {
    headers: bot(),
    ...(fresh ? { cache: "no-store" } : { next: { revalidate: 60 } }),
  });
  return r.ok ? r.json() : [];
}

export const botGuilds = () => get("/users/@me/guilds?limit=200", true);

export async function guildChannels(id) {
  return (await get(`/guilds/${id}/channels`))
    .filter((c) => c.type === 0)
    .sort((a, b) => a.position - b.position)
    .map((c) => ({ id: c.id, name: `#${c.name}` }));
}

export async function guildRoles(id) {
  return (await get(`/guilds/${id}/roles`))
    .filter((r) => r.id !== id && !r.managed)
    .sort((a, b) => b.position - a.position)
    .map((r) => ({ id: r.id, name: r.name }));
}

// The bot's own member object in a server (nickname, per-server avatar, banner, bio)
export async function botMember(id) {
  const r = await fetch(`${API}/guilds/${id}/members/@me`, { headers: bot(), cache: "no-store" });
  return r.ok ? r.json() : null;
}

export function patchBotMember(id, payload) {
  return fetch(`${API}/guilds/${id}/members/@me`, {
    method: "PATCH",
    headers: { ...bot(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function guildCategories(id) {
  return (await get(`/guilds/${id}/channels`))
    .filter((c) => c.type === 4)
    .sort((a, b) => a.position - b.position)
    .map((c) => ({ id: c.id, name: c.name }));
}

const json = { "Content-Type": "application/json" };
export const sendChannelMessage = (channelId, body) =>
  fetch(`${API}/channels/${channelId}/messages`, {
    method: "POST", headers: { ...bot(), ...json }, body: JSON.stringify(body),
  });
export const editChannelMessage = (channelId, messageId, body) =>
  fetch(`${API}/channels/${channelId}/messages/${messageId}`, {
    method: "PATCH", headers: { ...bot(), ...json }, body: JSON.stringify(body),
  });

// ---- members, roles and direct messages (bot token)
export async function guildMembersMap(id) {
  const list = await get(`/guilds/${id}/members?limit=1000`);
  const map = {};
  for (const m of Array.isArray(list) ? list : []) map[m.user.id] = m.nick || m.user.global_name || m.user.username;
  return map;
}
export const nameOf = (map, id) => (id ? map[String(id)] || String(id) : "-");

export async function guildRolesAll(id) {
  return (await get(`/guilds/${id}/roles`)).map((r) => ({ id: r.id, name: r.name }));
}

export async function searchMembers(id, q) {
  const r = await fetch(`${API}/guilds/${id}/members/search?query=${encodeURIComponent(q)}&limit=10`, {
    headers: bot(), cache: "no-store",
  });
  return r.ok ? r.json() : [];
}

export async function fetchMember(id, uid) {
  const r = await fetch(`${API}/guilds/${id}/members/${uid}`, { headers: bot(), cache: "no-store" });
  return r.ok ? r.json() : null;
}

const why = (reason) => ({ "X-Audit-Log-Reason": encodeURIComponent(String(reason)).slice(0, 400) });
export const addRole = (g, u, r, reason) =>
  fetch(`${API}/guilds/${g}/members/${u}/roles/${r}`, { method: "PUT", headers: { ...bot(), ...why(reason) } });
export const removeRole = (g, u, r, reason) =>
  fetch(`${API}/guilds/${g}/members/${u}/roles/${r}`, { method: "DELETE", headers: { ...bot(), ...why(reason) } });
export const deleteChannel = (id, reason) =>
  fetch(`${API}/channels/${id}`, { method: "DELETE", headers: { ...bot(), ...why(reason) } });

export async function dmUser(uid, body) {
  try {
    const r = await fetch(`${API}/users/@me/channels`, {
      method: "POST", headers: { ...bot(), ...json }, body: JSON.stringify({ recipient_id: String(uid) }),
    });
    if (!r.ok) return;
    const ch = await r.json();
    await sendChannelMessage(ch.id, body);
  } catch {}
}

export async function discordError(res) {
  const t = await res.json().catch(() => ({}));
  return t.message || "Discord refused the change";
}
