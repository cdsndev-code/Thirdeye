"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CommandsEditor({ guildId, commands }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [response, setResponse] = useState("");
  const [asEmbed, setAsEmbed] = useState(false);
  const [msg, setMsg] = useState("");
  const url = `/api/guilds/${guildId}/commands`;

  async function call(method, body) {
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) return setMsg((await r.json().catch(() => ({}))).error || "Error");
    setMsg("");
    router.refresh();
    return true;
  }

  async function save(e) {
    e.preventDefault();
    if (await call("POST", { name, response, as_embed: asEmbed })) {
      setName(""); setResponse(""); setAsEmbed(false);
    }
  }

  return (
    <>
      <p className="muted">Members type !name in chat and the bot replies. The names guide and status are reserved.</p>
      <div className="wrap">
        <table>
          <tbody>
            {commands.map((c) => (
              <tr key={c.name}>
                <td>!{c.name}</td>
                <td>{c.response.length > 80 ? c.response.slice(0, 80) + "..." : c.response}</td>
                <td>{c.as_embed ? <span className="tag">embed</span> : null}</td>
                <td className="row">
                  <button className="btn ghost" onClick={() => { setName(c.name); setResponse(c.response); setAsEmbed(!!c.as_embed); }}>Edit</button>
                  <button className="btn ghost" onClick={() => call("DELETE", { name: c.name })}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!commands.length ? <p className="muted">No custom commands yet.</p> : null}
      </div>
      <form onSubmit={save}>
        <label>Command name (without !)
          <input type="text" value={name} maxLength={32} onChange={(e) => setName(e.target.value)} placeholder="rules" />
        </label>
        <label>Reply
          <textarea value={response} maxLength={1500} onChange={(e) => setResponse(e.target.value)} placeholder="What the bot should say" />
        </label>
        <label className="check"><input type="checkbox" checked={asEmbed} onChange={(e) => setAsEmbed(e.target.checked)} /> Send as embed</label>
        <button className="btn" disabled={!name || !response}>Save command</button><span className="msg">{msg}</span>
      </form>
    </>
  );
}
