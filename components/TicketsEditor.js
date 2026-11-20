"use client";
import { useState } from "react";
import { GROUPS, DEFAULT_TEXTS, PLACEHOLDERS, fill, colorInt } from "../lib/tickets";

function md(s) {
  const esc = String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/```([\s\S]*?)```/g, (_, c) => `<pre>${c.trim()}</pre>`)
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\n/g, "<br>");
}

function Preview({ t, d, c, texts, values }) {
  const title = t ? fill(texts[t], values) : "";
  const hex = "#" + colorInt(texts[c]).toString(16).padStart(6, "0");
  return (
    <div className="embed" style={{ borderColor: hex }}>
      {title ? <h4 dangerouslySetInnerHTML={{ __html: md(title) }} /> : null}
      <div dangerouslySetInnerHTML={{ __html: md(fill(texts[d], values)) }} />
    </div>
  );
}

export default function TicketsEditor({ guildId, guildName, initial, channels, roles, discordCategories }) {
  const [cfg, setCfg] = useState(initial.config);
  const [cats, setCats] = useState(initial.categories);
  const [texts, setTexts] = useState(initial.texts);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const setC = (k, v) => setCfg((p) => ({ ...p, [k]: v }));
  const setT = (k, v) => setTexts((p) => ({ ...p, [k]: v }));
  const setCat = (i, k, v) => setCats((p) => p.map((c, j) => (j === i ? { ...c, [k]: v } : c)));
  const move = (i, d) =>
    setCats((p) => {
      const a = [...p], j = i + d;
      if (j < 0 || j >= a.length) return p;
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });

  const values = {
    user: "@Member", user_name: "Member", staff: "@Staff", staff_name: "Staff", closer: "@Staff",
    category: cats[0]?.label || "General help", reason: "Example reason", channel: "#general-help-member",
    server: guildName, delay: String(cfg.close_delay),
    categories: cats.map((c) => `\`${c.label}\``).join("\n"),
  };

  async function save(andPost) {
    setBusy(true);
    setMsg("Saving...");
    const r = await fetch(`/api/guilds/${guildId}/tickets`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: cfg, categories: cats, texts }),
    });
    if (!r.ok) {
      setBusy(false);
      return setMsg((await r.json().catch(() => ({}))).error || "Error");
    }
    if (andPost) {
      setMsg("Saved. Posting the panel...");
      const p = await fetch(`/api/guilds/${guildId}/tickets/panel`, { method: "POST" });
      setMsg(p.ok ? "Saved and the panel was posted or updated in Discord." : (await p.json().catch(() => ({}))).error || "Error");
    } else {
      setMsg("Saved. The bot picks it up within 30 seconds. Use Save and post panel to update the panel message.");
    }
    setBusy(false);
  }

  const sel = (k, items, label) => (
    <label>{label}
      <select value={cfg[k] || ""} onChange={(e) => setC(k, e.target.value || null)}>
        <option value="">Not set</option>
        {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <div className="card">
        <h2>Configuration</h2>
        <div className="two">
          {sel("category_id", discordCategories, "Discord category for ticket channels")}
          {sel("staff_role_id", roles, "Staff role")}
          {sel("panel_channel_id", channels, "Panel channel")}
          <label>Max open tickets per member
            <input type="number" min="1" max="10" value={cfg.max_open} onChange={(e) => setC("max_open", e.target.value)} />
          </label>
          <label>Seconds before a closed ticket is deleted
            <input type="number" min="0" max="60" value={cfg.close_delay} onChange={(e) => setC("close_delay", e.target.value)} />
          </label>
        </div>
        <label className="check"><input type="checkbox" checked={!!cfg.enabled} onChange={(e) => setC("enabled", e.target.checked ? 1 : 0)} /> Tickets enabled</label>
        <label className="check"><input type="checkbox" checked={!!cfg.dm_enabled} onChange={(e) => setC("dm_enabled", e.target.checked ? 1 : 0)} /> Send direct messages to the ticket creator</label>
      </div>

      <div className="card">
        <h2>Categories</h2>
        <p className="muted">Members choose one when opening a ticket (up to 25). Leaving this empty uses the default list.</p>
        {cats.map((c, i) => (
          <div className="catrow" key={i}>
            <input type="text" value={c.label} maxLength={80} placeholder="Name" onChange={(e) => setCat(i, "label", e.target.value)} />
            <input type="text" value={c.description} maxLength={100} placeholder="Description" onChange={(e) => setCat(i, "description", e.target.value)} />
            <span className="row">
              <button type="button" className="btn ghost" onClick={() => move(i, -1)}>Up</button>
              <button type="button" className="btn ghost" onClick={() => move(i, 1)}>Down</button>
              <button type="button" className="btn ghost" onClick={() => setCats((p) => p.filter((_, j) => j !== i))}>Remove</button>
            </span>
          </div>
        ))}
        <button type="button" className="btn ghost" disabled={cats.length >= 25} onClick={() => setCats((p) => [...p, { label: "", description: "" }])}>Add category</button>
      </div>

      <h2>Messages</h2>
      <p className="muted">Placeholders: <code>{PLACEHOLDERS}</code>. Discord formatting works: **bold**, `code`, ```code block```. An empty field restores the default.</p>
      {GROUPS.map((g) => (
        <details className="card" key={g.id} open={g.id === "panel"}>
          <summary><b>{g.title}</b></summary>
          <p className="muted">{g.help}</p>
          {g.fields.map(([key, label, max, kind]) => (
            <label key={key}>{label}
              {kind === "long" ? (
                <textarea value={texts[key]} maxLength={max} onChange={(e) => setT(key, e.target.value)} />
              ) : kind === "color" ? (
                <input type="color" value={texts[key]} onChange={(e) => setT(key, e.target.value)} />
              ) : (
                <input type="text" value={texts[key]} maxLength={max} onChange={(e) => setT(key, e.target.value)} />
              )}
            </label>
          ))}
          {g.previews.map(([t, d, c], i) => <Preview key={i} t={t} d={d} c={c} texts={texts} values={values} />)}
          <button type="button" className="btn ghost" onClick={() => g.fields.forEach(([k]) => setT(k, DEFAULT_TEXTS[k]))}>Reset this section</button>
        </details>
      ))}

      <div className="row" style={{ margin: "10px 0 30px" }}>
        <button className="btn" disabled={busy} onClick={() => save(false)}>Save</button>
        <button className="btn" disabled={busy} onClick={() => save(true)}>Save and post panel</button>
        <span className="msg">{msg}</span>
      </div>
    </>
  );
}
