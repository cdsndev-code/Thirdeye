"use client";
import { useState } from "react";

export default function VerifyPanelButton({ guildId }) {
  const [msg, setMsg] = useState("");
  async function post() {
    setMsg("Posting...");
    const r = await fetch(`/api/guilds/${guildId}/verify/panel`, { method: "POST" });
    setMsg(r.ok ? "Verify panel posted in Discord." : (await r.json().catch(() => ({}))).error || "Error");
  }
  return (
    <p>
      <button type="button" className="btn ghost" onClick={post}>Post verify panel</button>
      <span className="msg">{msg}</span>
    </p>
  );
}
