"use client";

import { useEffect, useState } from "react";

/**
 * Dashboard App do Chatwoot — carregado como iframe na lateral da conversa.
 * Recebe o contexto via postMessage do Chatwoot, extrai o telefone do contato
 * e busca o resumo do lead no CRM (autenticado por token na URL).
 */
export default function ChatwootEmbed() {
  const [lead, setLead] = useState<any | null>(null);
  const [state, setState] = useState<"loading" | "empty" | "ready">("loading");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") || "";

    async function lookup(phone: string) {
      if (!phone) {
        setState("empty");
        return;
      }
      try {
        const r = await fetch(`/api/embed/lead?token=${encodeURIComponent(token)}&phone=${encodeURIComponent(phone)}`);
        const j = await r.json();
        if (j.lead) {
          setLead(j.lead);
          setState("ready");
        } else setState("empty");
      } catch {
        setState("empty");
      }
    }

    function onMessage(ev: MessageEvent) {
      try {
        const data = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
        const payload = data?.data || data;
        const contact = payload?.contact || payload?.conversation?.meta?.sender || {};
        const phone = contact?.phone_number || contact?.identifier || "";
        if (phone) lookup(String(phone));
      } catch {
        /* ignore */
      }
    }

    window.addEventListener("message", onMessage);
    // pede o contexto ao Chatwoot
    window.parent?.postMessage("chatwoot-dashboard-app:fetch-info", "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, Arial", padding: 12, fontSize: 14, color: "#222" }}>
      {state === "loading" && <p style={{ color: "#888" }}>Carregando contexto do CRM…</p>}
      {state === "empty" && <p style={{ color: "#888" }}>Nenhum lead encontrado no CRM para este contato.</p>}
      {state === "ready" && lead && (
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>{lead.name}</h3>
          <div style={{ color: "#666", marginBottom: 8 }}>{lead.phone}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {lead.status && <span style={badge}>{lead.status}</span>}
            {lead.bot_status && <span style={badge}>bot: {lead.bot_status}</span>}
          </div>
          {lead.preview_url && (
            <p style={{ margin: "6px 0" }}>
              <a href={lead.preview_url} target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>
                Ver prévia →
              </a>
            </p>
          )}
          {lead.recommendations && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: "pointer", color: "#7c3aed" }}>Recomendações da IA</summary>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13, marginTop: 6 }}>
                {lead.recommendations}
              </pre>
            </details>
          )}
          <p style={{ marginTop: 12 }}>
            <a href={lead.url} target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>
              Abrir no CRM →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

const badge: React.CSSProperties = {
  background: "#ece9fb",
  color: "#5b21b6",
  borderRadius: 6,
  padding: "2px 8px",
  fontSize: 12,
};
