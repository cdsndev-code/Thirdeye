"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TicketControl({ guildId, tickets }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  async function close(t) {
    if (!confirm(`Close and delete this ticket (${t.category})?`)) return;
    const reason = prompt("Reason (optional)", "Closed from the dashboard");
    if (reason === null) return;
    setBusy(t.channel_id);
    const r = await fetch(`/api/guilds/${guildId}/tickets/close`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel_id: t.channel_id, reason }),
    });
    setBusy("");
    if (!r.ok) return setMsg((await r.json().catch(() => ({}))).error || "Error");
    setMsg("Ticket closed.");
    router.refresh();
  }

  return (
    <>
      <div className="wrap">
        <table>
          <thead><tr><th>Category</th><th>Opened by</th><th>Claimed by</th><th>Opened</th><th></th></tr></thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.channel_id}>
                <td>{t.category}</td><td>{t.owner}</td><td>{t.claimed}</td><td>{t.created}</td>
                <td className="row">
                  <a className="btn ghost" href={`https://discord.com/channels/${guildId}/${t.channel_id}`} target="_blank" rel="noreferrer">Open</a>
                  <button className="btn ghost" disabled={busy === t.channel_id} onClick={() => close(t)}>Close</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!tickets.length ? <p className="muted">No open tickets.</p> : null}
      </div>
      <span className="msg">{msg}</span>
    </>
  );
}
