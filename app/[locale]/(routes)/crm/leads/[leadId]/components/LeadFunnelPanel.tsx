"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, UploadCloud, Bot, Send, ExternalLink } from "lucide-react";
import { generateLeadRecommendations } from "@/actions/crm/leads/ai-recommendations";
import {
  saveLeadProposal,
  draftBotMessage,
  sendBotMessage,
  setLeadBotStatus,
} from "@/actions/crm/leads/funnel";

const BOT_LABELS: Record<string, string> = {
  idle: "Inativo",
  draft: "Rascunho pendente",
  active: "Ativo",
  handoff: "Com humano",
};

export default function LeadFunnelPanel({ lead }: { lead: any }) {
  const [recs, setRecs] = useState<string | null>(lead.recommendations || null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const [images, setImages] = useState<string[]>(lead.proposal_images || []);
  const [previewSlug, setPreviewSlug] = useState<string>(lead.preview_slug || "");
  const [previewUrl, setPreviewUrl] = useState<string>(lead.preview_url || "");
  const [previewDomain, setPreviewDomain] = useState<string>(lead.preview_domain || "");
  const [uploading, setUploading] = useState(false);
  const [savingProposal, setSavingProposal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [botStatus, setBotStatus] = useState<string>(lead.bot_status || "idle");
  const [draft, setDraft] = useState<string>(lead.bot_draft || "");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);

  async function runRecs() {
    setLoadingRecs(true);
    try {
      const r = await generateLeadRecommendations(lead.id);
      if ((r as any).error) toast.error((r as any).error);
      else {
        setRecs((r as any).data.recommendations);
        toast.success("Recomendações geradas");
      }
    } finally {
      setLoadingRecs(false);
    }
  }

  async function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const presignRes = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type, folder: "images" }),
        });
        const p = await presignRes.json();
        if (!presignRes.ok) throw new Error(p?.error || "Falha ao preparar upload");
        const put = await fetch(p.presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!put.ok) throw new Error("Falha no upload da imagem");
        urls.push(p.fileUrl);
      }
      const next = [...images, ...urls];
      setImages(next);
      const save = await saveLeadProposal({ leadId: lead.id, proposal_images: next });
      if ((save as any).error) toast.error((save as any).error);
      else toast.success(`${urls.length} imagem(ns) enviada(s)`);
    } catch (err: any) {
      toast.error(err?.message || "Falha no upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function removeImage(url: string) {
    const next = images.filter((u) => u !== url);
    setImages(next);
    await saveLeadProposal({ leadId: lead.id, proposal_images: next });
  }

  async function publishZip(e: React.ChangeEvent<HTMLInputElement>) {
    const file = (e.target.files || [])[0];
    if (!file) return;
    if (!previewSlug.trim()) {
      toast.error("Defina o slug da prévia e salve antes de publicar o ZIP");
      e.target.value = "";
      return;
    }
    setPublishing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("slug", previewSlug.trim());
      fd.append("leadId", lead.id);
      const res = await fetch("/api/preview/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) toast.error(j?.error || "Falha ao publicar");
      else {
        if (j.preview_url) setPreviewUrl(j.preview_url);
        toast.success("Prévia publicada");
      }
    } catch (err: any) {
      toast.error(err?.message || "Falha ao publicar");
    } finally {
      setPublishing(false);
      e.target.value = "";
    }
  }

  async function saveProposal() {
    setSavingProposal(true);
    try {
      const r = await saveLeadProposal({
        leadId: lead.id,
        preview_slug: previewSlug || null,
        preview_url: previewUrl || null,
        preview_domain: previewDomain || null,
      });
      if ((r as any).error) toast.error((r as any).error);
      else {
        if ((r as any).data?.preview_url) setPreviewUrl((r as any).data.preview_url);
        toast.success("Proposta salva");
      }
    } finally {
      setSavingProposal(false);
    }
  }

  async function runDraft() {
    setDrafting(true);
    try {
      const r = await draftBotMessage(lead.id);
      if ((r as any).error) toast.error((r as any).error);
      else {
        setDraft((r as any).data.draft);
        setBotStatus("draft");
        toast.success("Rascunho gerado — revise antes de enviar");
      }
    } finally {
      setDrafting(false);
    }
  }

  async function approveSend() {
    if (!draft.trim()) {
      toast.error("Rascunho vazio");
      return;
    }
    setSending(true);
    try {
      const r = await sendBotMessage({ leadId: lead.id, text: draft.trim() });
      if ((r as any).error) toast.error((r as any).error);
      else {
        setBotStatus("active");
        toast.success("Mensagem enviada — bot ativo");
      }
    } finally {
      setSending(false);
    }
  }

  async function toggleHandoff() {
    const next = botStatus === "handoff" ? "active" : "handoff";
    const r = await setLeadBotStatus({ leadId: lead.id, status: next });
    if ((r as any).error) toast.error((r as any).error);
    else {
      setBotStatus(next);
      toast.success(next === "handoff" ? "Bot pausado (humano assume)" : "Bot reativado");
    }
  }

  return (
    <div className="space-y-5">
      {/* 1. Recomendações da IA */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> 1. Análise & Recomendações (IA)
          </CardTitle>
          <Button size="sm" onClick={runRecs} disabled={loadingRecs}>
            {loadingRecs ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {recs ? "Gerar novamente" : "Gerar"}
          </Button>
        </CardHeader>
        <CardContent>
          {recs ? (
            <pre className="whitespace-pre-wrap text-sm font-sans">{recs}</pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              A IA analisa o cliente e gera oportunidades + proposta de site + ângulo de venda para você ler.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 2. Proposta (imagens + prévia + domínio) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UploadCloud className="h-4 w-4" /> 2. Proposta (design, prévia e domínio)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Imagens da proposta</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {images.map((url) => (
                <div key={url} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="proposta" className="h-24 w-24 object-cover rounded border" />
                  <button
                    onClick={() => removeImage(url)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="h-24 w-24 border-2 border-dashed rounded flex items-center justify-center cursor-pointer text-muted-foreground hover:bg-muted">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                <input type="file" accept="image/*" multiple className="hidden" onChange={onPickImages} disabled={uploading} />
              </label>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Slug da prévia</label>
              <Input
                placeholder="ex.: padaria-do-ze"
                value={previewSlug}
                onChange={(e) => setPreviewSlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Gera {previewSlug || "<slug>"}.preview.amzc.tech
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">URL da prévia</label>
              <Input
                placeholder="https://..."
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Domínio do cliente (opcional)</label>
              <Input
                placeholder="ex.: www.cliente.com.br"
                value={previewDomain}
                onChange={(e) => setPreviewDomain(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button size="sm" onClick={saveProposal} disabled={savingProposal}>
              {savingProposal && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar proposta
            </Button>
            <label className="inline-flex items-center text-sm border rounded px-3 py-1.5 cursor-pointer hover:bg-muted">
              {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
              Publicar site (.zip)
              <input type="file" accept=".zip,application/zip" className="hidden" onChange={publishZip} disabled={publishing} />
            </label>
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary inline-flex items-center gap-1"
              >
                Abrir prévia <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. BOT agente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4" /> 3. BOT agente
            <Badge variant={botStatus === "active" ? "default" : "secondary"}>
              {BOT_LABELS[botStatus] || botStatus}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={runDraft} disabled={drafting}>
              {drafting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Gerar rascunho
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            O bot prepara a 1ª mensagem (com a prévia). Revise e aprove para enviar pelo WhatsApp. Depois o bot
            responde automaticamente; use “Assumir conversa” para pausá-lo.
          </p>
          <Textarea
            rows={5}
            placeholder="O rascunho da mensagem aparecerá aqui..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={approveSend} disabled={sending || !draft.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Aprovar e enviar
            </Button>
            {(botStatus === "active" || botStatus === "handoff") && (
              <Button size="sm" variant="outline" onClick={toggleHandoff}>
                {botStatus === "handoff" ? "Reativar bot" : "Assumir conversa"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
