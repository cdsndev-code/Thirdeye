"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileEditor({ guildId, current }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const url = `/api/guilds/${guildId}/profile`;

  async function send(method, body) {
    setBusy(true);
    setMsg("Saving...");
    const r = await fetch(url, { method, body });
    setBusy(false);
    if (!r.ok) return setMsg((await r.json().catch(() => ({}))).error || "Error");
    setMsg("Saved.");
    router.refresh();
    return true;
  }

  async function save(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    let total = 0;
    for (const k of ["avatar", "banner"]) {
      const f = fd.get(k);
      if (f && f.size) total += f.size;
    }
    if (total > 4 * 1024 * 1024) return setMsg("The images together must be under 4 MB.");
    if (await send("POST", fd)) form.reset();
  }

  async function reset() {
    if (confirm("Reset the bot's name, bio, avatar and banner in this server?")) await send("DELETE");
  }

  return (
    <form onSubmit={save}>
      <div className="row" style={{ marginBottom: 8 }}>
        {current.avatar ? <img className="pfp" src={current.avatar} alt="" /> : <div className="pfp" />}
        <div>
          <div>{current.nick || current.name || "Bot"}</div>
          <div className="muted">Current profile in this server</div>
        </div>
      </div>
      <div className="two">
        <label>Name (server nickname)
          <input type="text" name="name" maxLength={32} placeholder={current.nick || current.name} />
        </label>
        <label>Bio (max 190 characters)
          <input type="text" name="bio" maxLength={190} />
        </label>
        <label>Avatar (PNG, JPG, GIF, WEBP)
          <input type="file" name="avatar" accept="image/png,image/jpeg,image/gif,image/webp" />
        </label>
        <label>Banner
          <input type="file" name="banner" accept="image/png,image/jpeg,image/gif,image/webp" />
        </label>
      </div>
      <p className="muted">Changes apply only to this server. Empty fields stay as they are.</p>
      <div className="row">
        <button className="btn" disabled={busy}>Save profile</button>
        <button type="button" className="btn ghost" onClick={reset} disabled={busy}>Reset to default</button>
        <span className="msg">{msg}</span>
      </div>
    </form>
  );
}
