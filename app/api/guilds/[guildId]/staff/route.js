import { requireGuild } from "../../../../../lib/session";
import { applyStaff, newEntry } from "../../../../../lib/staffDb";
import { STAFF_KINDS } from "../../../../../lib/staff";

const bad = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req, { params }) {
  const { guildId } = await params;
  const s = await requireGuild(guildId);
  if (!s) return bad("Forbidden", 403);
  const b = await req.json().catch(() => null);
  const action = String(b?.action || "");
  const memberId = String(b?.member_id || "");
  const roleId = b?.role_id ? String(b.role_id) : null;
  const reason = String(b?.reason || "").trim().slice(0, 500);
  if (!/^\d{17,20}$/.test(memberId)) return bad("Choose a member first");
  if (roleId && !/^\d{17,20}$/.test(roleId)) return bad("Invalid role");

  if (action === "clear") {
    await newEntry(guildId, memberId, s.uid, "clear", "Warnings cleared");
    return Response.json({ ok: true, message: "Warnings cleared." });
  }
  if (!(action in STAFF_KINDS)) return bad("Unknown action");
  if (!reason) return bad("Write a reason");
  const res = await applyStaff({ guildId, actor: { uid: s.uid, name: s.name }, kind: action, memberId, roleId, reason });
  return res.ok ? Response.json(res) : bad(res.error);
}
