"use client";
import { useState } from "react";

export default function SettingsForm({ guildId, initial, channels, roles }) {
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState("");
  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));

  async function save(e) {
    e.preventDefault();
    setMsg("Saving...");
    const r = await fetch(`/api/guilds/${guildId}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    setMsg(r.ok ? "Saved. The bot picks it up within 30 seconds." : (await r.json()).error || "Error");
  }

  const sel = (k, items, label) => (
    <label>
      {label}
      <select value={v[k] || ""} onChange={(e) => set(k, e.target.value || null)}>
        <option value="">Not set</option>
        {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
      </select>
    </label>
  );

  return (
    <form onSubmit={save}>
      <div className="two">
        {sel("log_channel", channels, "Log channel")}
        <label>
          Appeal link
          <input type="text" value={v.appeal_link} placeholder="https://..." onChange={(e) => set("appeal_link", e.target.value)} />
        </label>
        {sel("verify_channel", channels, "Verification channel")}
        {sel("verify_role", roles, "Verified role")}
      </div>
      <label className="check"><input type="checkbox" checked={!!v.antispam} onChange={(e) => set("antispam", e.target.checked ? 1 : 0)} /> Anti-spam and webhook protection</label>
      <label className="check"><input type="checkbox" checked={!!v.antiraid} onChange={(e) => set("antiraid", e.target.checked ? 1 : 0)} /> Anti-raid</label>
      <button className="btn">Save</button><span className="msg">{msg}</span>
      <p className="muted">To post the verify panel in the verification channel, use /setup in Discord.</p>
    </form>
  );
}
