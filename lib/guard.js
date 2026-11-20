import { redirect } from "next/navigation";
import { requireGuild } from "./session";

export async function guard(guildId) {
  const s = await requireGuild(guildId);
  if (!s) redirect("/");
  return s;
}
