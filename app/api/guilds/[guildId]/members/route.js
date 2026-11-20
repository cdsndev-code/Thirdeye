import { requireGuild } from "../../../../../lib/session";
import { searchMembers } from "../../../../../lib/discord";

export async function GET(req, { params }) {
  const { guildId } = await params;
  if (!(await requireGuild(guildId))) return Response.json({ error: "Forbidden" }, { status: 403 });
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return Response.json([]);
  const list = await searchMembers(guildId, q.slice(0, 50));
  return Response.json(
    list.map((m) => ({ id: m.user.id, name: m.nick || m.user.global_name || m.user.username, username: m.user.username }))
  );
}
