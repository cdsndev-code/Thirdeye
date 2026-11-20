"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LevelingEditor({ guildId, channels, roles, initial }) {
  const router = useRouter();
  const [cfg, setCfg] = useState(initial.config);
  const [rewards, setRewards] = useState(initial.rewards);
  const [msg, setMsg] = useState("");
  const setR = (i, k, v) => setRewards((p) => p.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  async function save(e) {
    e.preventDefault();
    setMsg("Saving...");
    const r = await fetch(`/api/guilds/${guildId}/leveling`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: cfg, rewards }),
    });
    setMsg(r.ok ? "Saved." : (await r.json().catch(() => ({}))).error || "Error");
    if (r.ok) router.refresh();
  }

  return (
    <form onSubmit={save}>
      <label className="check"><input type="checkbox" checked={!!cfg.level_enabled} onChange={(e) => setCfg({ ...cfg, level_enabled: e.target.checked ? 1 : 0 })} /> Rank system enabled</label>
      <label>Level-up channel
        <select value={cfg.level_channel || ""} onChange={(e) => setCfg({ ...cfg, level_channel: e.target.value || null })}>
          <option value="">Same channel as the message</option>
          {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <h3>Level rewards</h3>
      <p className="muted">A member receives the role when reaching the level (rewards stack). The bot role must be above these roles.</p>
      {rewards.map((r, i) => (
        <div className="catrow" key={i}>
          <input type="number" min="1" max="500" value={r.level} onChange={(e) => setR(i, "level", e.target.value)} placeholder="Level" />
          <select value={r.role_id} onChange={(e) => setR(i, "role_id", e.target.value)}>
            <option value="">Choose a role</option>
            {roles.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <button type="button" className="btn ghost" onClick={() => setRewards((p) => p.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      <p><button type="button" className="btn ghost" onClick={() => setRewards((p) => [...p, { level: 5, role_id: "" }])}>Add reward</button></p>
      <button className="btn">Save</button><span className="msg">{msg}</span>
    </form>
  );
}
