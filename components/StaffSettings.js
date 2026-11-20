"use client";
import { useState } from "react";
import { fill } from "../lib/staff";
import { md } from "../lib/md";

const KINDS = [["promote", "Promotion"], ["demote", "Demotion"], ["warn", "Warning"], ["dismiss", "Dismissal"]];

export default function StaffSettings({ guildId, guildName, channels, initial, templates, defaults }) {
  const [cfg, setCfg] = useState(initial);
  const [tpl, setTpl] = useState(templates);
  const [msg, setMsg] = useState("");
  const setT = (k, f, v) => setTpl((p) => ({ ...p, [k]: { ...p[k], [f]: v } }));

  const values = {
    user: "@Member", user_name: "Member", mod: "@You", mod_name: "You", reason: "Example reason",
    old_role: "Moderator", new_role: "Senior Moderator", warns: "2", limit: String(cfg.warn_limit),
    date: new Date().toISOString().slice(0, 10), server: guildName,
  };

  async function save(e) {
    e.preventDefault();
    setMsg("Saving...");
    const r = await fetch(`/api/guilds/${guildId}/staff/settings`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_channel: cfg.staff_channel, warn_limit: cfg.warn_limit, templates: tpl }),
    });
    setMsg(r.ok ? "Saved." : (await r.json().catch(() => ({}))).error || "Error");
  }

  return (
    <form onSubmit={save}>
      <div className="two">
        <label>Announcement channel
          <select value={cfg.staff_channel || ""} onChange={(e) => setCfg({ ...cfg, staff_channel: e.target.value || null })}>
            <option value="">Not set (the log channel is used)</option>
            {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Warnings before dismissal
          <input type="number" min="1" max="20" value={cfg.warn_limit} onChange={(e) => setCfg({ ...cfg, warn_limit: e.target.value })} />
        </label>
      </div>
      <h3>Embeds</h3>
      <p className="muted">Placeholders: <code>{"{user} {user_name} {mod} {mod_name} {reason} {old_role} {new_role} {warns} {limit} {date} {server}"}</code></p>
      {KINDS.map(([k, label]) => (
        <details className="card" key={k}>
          <summary><b>{label}</b></summary>
          <label>Title<input type="text" value={tpl[k].title} maxLength={256} onChange={(e) => setT(k, "title", e.target.value)} /></label>
          <label>Description<textarea value={tpl[k].description} maxLength={4000} onChange={(e) => setT(k, "description", e.target.value)} /></label>
          <div className="two">
            <label>Footer<input type="text" value={tpl[k].footer} maxLength={200} onChange={(e) => setT(k, "footer", e.target.value)} /></label>
            <label>Image link (optional)<input type="text" value={tpl[k].image_url} maxLength={300} onChange={(e) => setT(k, "image_url", e.target.value)} /></label>
          </div>
          <label>Color<input type="color" value={tpl[k].color} onChange={(e) => setT(k, "color", e.target.value)} /></label>
          <div className="embed" style={{ borderColor: tpl[k].color }}>
            <h4 dangerouslySetInnerHTML={{ __html: md(fill(tpl[k].title, values)) }} />
            <div dangerouslySetInnerHTML={{ __html: md(fill(tpl[k].description, values)) }} />
          </div>
          <button type="button" className="btn ghost" onClick={() => setTpl((p) => ({ ...p, [k]: defaults[k] }))}>Reset to default</button>
        </details>
      ))}
      <button className="btn">Save</button><span className="msg">{msg}</span>
    </form>
  );
}
