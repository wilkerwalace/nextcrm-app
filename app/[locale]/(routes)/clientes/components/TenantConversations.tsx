"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, Pause, Play, MessageSquare } from "lucide-react";
import { getConversation, sendTenantManualMessage, toggleConversationPause } from "@/actions/clientes/conversations";

export default function TenantConversations({ conversations }: { conversations: any[] }) {
  const [list, setList] = useState(conversations || []);
  const [sel, setSel] = useState<any | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function open(c: any) {
    setSel(c);
    setLoading(true);
    try {
      const full = await getConversation(c.id);
      setMsgs((full as any)?.messages || []);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (!sel || !text.trim()) return;
    setSending(true);
    try {
      const r = await sendTenantManualMessage({ conversationId: sel.id, text: text.trim() });
      if ((r as any).error) toast.error((r as any).error);
      else {
        setMsgs([...msgs, { id: Math.random().toString(), direction: "OUT", content: text.trim(), timestamp: new Date().toISOString() }]);
        setText("");
      }
    } finally {
      setSending(false);
    }
  }

  async function togglePause() {
    if (!sel) return;
    const next = !sel.agent_paused;
    const r = await toggleConversationPause({ conversationId: sel.id, paused: next });
    if ((r as any).error) toast.error((r as any).error);
    else {
      setSel({ ...sel, agent_paused: next });
      setList(list.map((c) => (c.id === sel.id ? { ...c, agent_paused: next } : c)));
      toast.success(next ? "Agente pausado (você assumiu)" : "Agente reativado");
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <Card>
        <CardContent className="pt-4 space-y-1 max-h-[520px] overflow-y-auto">
          {list.length === 0 && <p className="text-sm text-muted-foreground">Sem conversas ainda.</p>}
          {list.map((c) => (
            <button
              key={c.id}
              onClick={() => open(c)}
              className={`w-full text-left p-2 rounded hover:bg-muted ${sel?.id === c.id ? "bg-muted" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{c.name || c.remoteNumber}</span>
                <Badge variant="outline" className="text-[10px]">{c.channel}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {c._count?.messages ?? 0} msgs {c.agent_paused && "· pausado"}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          {!sel ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Selecione uma conversa
            </div>
          ) : (
            <div className="flex flex-col h-[520px]">
              <div className="flex items-center justify-between border-b pb-2 mb-2">
                <div className="font-medium">{sel.name || sel.remoteNumber}</div>
                <Button size="sm" variant="outline" onClick={togglePause}>
                  {sel.agent_paused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                  {sel.agent_paused ? "Reativar agente" : "Assumir conversa"}
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {msgs.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                      m.direction === "IN" ? "bg-muted" : "bg-primary text-primary-foreground ml-auto"
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2 border-t pt-2">
                <Input
                  placeholder={sel.channel === "widget" ? "Responder (só registra; widget é sob demanda)" : "Responder pelo WhatsApp..."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
                <Button size="sm" onClick={send} disabled={sending || !text.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
