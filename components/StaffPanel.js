"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const KINDS = [["promote", "Promotion"], ["demote", "Demotion"], ["warn", "Warning"], ["dismiss", "Dismissal"]];

export default function StaffPanel({ guildId, chainRoles, limit }) {
  const router = useRouter();
  const [kind, setKind] = useState("promote");
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [member, setMember] = useState(null);
  const [role, setRole] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const needsRole = kind === "promote" || kind === "demote";

  async function search(e) {
    e.preventDefault();
    if (!q.trim()) return;
    const r = await fetch(`/api/guilds/${guildId}/members?q=${encodeURIComponent(q.trim())}`);
    setResults(r.ok ? await r.json() : []);
  }

  async function send(action) {
    setBusy(true);
    setMsg("Working...");
    const r = await fetch(`/api/guilds/${guildId}/staff`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, member_id: member?.id, role_id: needsRole ? role : null, reason }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg(r.ok ? data.message : data.error || "Error");
    if (r.ok) { setReason(""); router.refresh(); }
  }

  return (
    <>
      <div className="two">
        <label>1. Action
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        {needsRole ? (
          <label>2. Rank role (from the chain)
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Choose a role</option>
              {chainRoles.map((r) => <option key={r.id} value={r.id}>{r.name} (rank {r.rank})</option>)}
            </select>
          </label>
        ) : <div />}
      </div>

      <form onSubmit={search} className="row" style={{ marginTop: 12 }}>
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a member by name" style={{ maxWidth: 300 }} />
        <button className="btn ghost">Search</button>
        {member ? <span>Selected: <b>{member.name}</b></span> : null}
      </form>
      <div className="row" style={{ marginTop: 8 }}>
        {results.map((m) => (
          <button key={m.id} type="button" className="btn ghost" onClick={() => { setMember(m); setResults([]); }}>{m.name}</button>
        ))}
      </div>

      <label>Reason
        <textarea value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
      </label>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" disabled={busy || !member || !reason.trim() || (needsRole && !role)} onClick={() => send(kind)}>Run action</button>
        <button className="btn ghost" disabled={busy || !member} onClick={() => send("clear")}>Clear this member&apos;s warnings</button>
        <span className="msg">{msg}</span>
      </div>
      <p className="muted">{limit} warnings in a row dismiss the member automatically (all chain roles are removed).</p>
    </>
  );
}
