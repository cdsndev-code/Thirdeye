"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChainEditor({ guildId, chain, roles }) {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [rank, setRank] = useState(10);
  const [msg, setMsg] = useState("");
  const url = `/api/guilds/${guildId}/chain`;

  async function call(method, body) {
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) return setMsg((await r.json()).error || "Error");
    setMsg("");
    router.refresh();
  }

  return (
    <>
      <p className="muted">Higher rank can punish lower ranks only. Administrators are always on top.</p>
      <div className="wrap">
        <table>
          <tbody>
            {chain.map((c) => (
              <tr key={c.role_id}>
                <td>Rank {c.rank}</td><td>{c.name}</td>
                <td><button className="btn ghost" onClick={() => call("DELETE", { role_id: c.role_id })}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!chain.length ? <p className="muted">No roles yet.</p> : null}
      </div>
      <div className="two" style={{ marginTop: 12 }}>
        <label>Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Choose a role</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label>Rank (1-100)
          <input type="number" min="1" max="100" value={rank} onChange={(e) => setRank(e.target.value)} />
        </label>
      </div>
      <button className="btn" disabled={!role} onClick={() => call("POST", { role_id: role, rank: Number(rank) })}>Add or update</button>
      <span className="msg">{msg}</span>
    </>
  );
}
