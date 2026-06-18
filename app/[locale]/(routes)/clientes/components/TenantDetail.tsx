"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, RefreshCw, Plus } from "lucide-react";
import { updateTenant, regenWidgetKey } from "@/actions/clientes/tenants";
import { setAvailability, createAppointment, updateAppointmentStatus } from "@/actions/clientes/agenda";
import TenantWhatsAppConnect from "./TenantWhatsAppConnect";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function TenantDetail({ tenant }: { tenant: any }) {
  // Agente
  const [agentEnabled, setAgentEnabled] = useState(!!tenant.agent_enabled);
  const [agentName, setAgentName] = useState(tenant.agent_name || "");
  const [greeting, setGreeting] = useState(tenant.agent_greeting || "");
  const [persona, setPersona] = useState(tenant.agent_persona || "");
  const [status, setStatus] = useState(tenant.status || "active");
  const [savingAgent, setSavingAgent] = useState(false);

  // Canais
  const [widgetKey, setWidgetKey] = useState(tenant.widget_key || "");

  // Agenda
  const initialAvail: Record<number, { start: string; end: string; slot: number; on: boolean }> = {};
  for (let d = 0; d < 7; d++) {
    const found = (tenant.availability || []).find((a: any) => a.weekday === d);
    initialAvail[d] = found
      ? { start: found.start_time, end: found.end_time, slot: found.slot_minutes, on: true }
      : { start: "09:00", end: "18:00", slot: 30, on: d >= 1 && d <= 5 };
  }
  const [avail, setAvail] = useState(initialAvail);
  const [savingAvail, setSavingAvail] = useState(false);
  const [appts, setAppts] = useState<any[]>(tenant.appointments || []);
  const [apptWhen, setApptWhen] = useState("");
  const [apptName, setApptName] = useState("");
  const [apptPhone, setApptPhone] = useState("");
  const [addingAppt, setAddingAppt] = useState(false);

  async function saveAgent() {
    setSavingAgent(true);
    try {
      const r = await updateTenant({
        id: tenant.id,
        status,
        agent_enabled: agentEnabled,
        agent_name: agentName || null,
        agent_greeting: greeting || null,
        agent_persona: persona || null,
      });
      if ((r as any).error) toast.error((r as any).error);
      else toast.success("Agente salvo");
    } finally {
      setSavingAgent(false);
    }
  }

  async function regen() {
    const r = await regenWidgetKey(tenant.id);
    if ((r as any).error) toast.error((r as any).error);
    else {
      setWidgetKey((r as any).data.widget_key);
      toast.success("Nova chave gerada");
    }
  }

  async function saveAvail() {
    setSavingAvail(true);
    try {
      const slots = Object.entries(avail)
        .filter(([, v]) => v.on)
        .map(([d, v]) => ({ weekday: Number(d), start_time: v.start, end_time: v.end, slot_minutes: v.slot }));
      const r = await setAvailability({ clientTenantId: tenant.id, slots });
      if ((r as any).error) toast.error((r as any).error);
      else toast.success("Disponibilidade salva");
    } finally {
      setSavingAvail(false);
    }
  }

  async function addAppt() {
    if (!apptWhen) {
      toast.error("Informe data/hora");
      return;
    }
    setAddingAppt(true);
    try {
      const r = await createAppointment({
        clientTenantId: tenant.id,
        scheduled_at: new Date(apptWhen).toISOString(),
        customer_name: apptName || undefined,
        customer_phone: apptPhone || undefined,
        source: "manual",
      });
      if ((r as any).error) toast.error((r as any).error);
      else {
        setAppts([
          { id: (r as any).data.id, scheduled_at: new Date(apptWhen).toISOString(), customer_name: apptName, customer_phone: apptPhone, status: "scheduled", source: "manual" },
          ...appts,
        ]);
        setApptWhen(""); setApptName(""); setApptPhone("");
        toast.success("Agendamento criado");
      }
    } finally {
      setAddingAppt(false);
    }
  }

  async function setApptStatus(id: string, st: string) {
    const r = await updateAppointmentStatus({ id, status: st });
    if ((r as any).error) toast.error((r as any).error);
    else setAppts(appts.map((a) => (a.id === id ? { ...a, status: st } : a)));
  }

  const widgetSnippet = `<script src="https://crm.amzc.tech/widget.js" data-key="${widgetKey}" async></script>`;

  return (
    <Tabs defaultValue="agente">
      <TabsList>
        <TabsTrigger value="agente">Agente</TabsTrigger>
        <TabsTrigger value="agenda">Agenda</TabsTrigger>
        <TabsTrigger value="canais">Canais</TabsTrigger>
      </TabsList>

      {/* AGENTE */}
      <TabsContent value="agente">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuração do agente de IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={agentEnabled} onCheckedChange={setAgentEnabled} id="ag" />
              <Label htmlFor="ag">Agente ativo</Label>
              <span className="ml-4 text-sm text-muted-foreground">Status do cliente:</span>
              <select className="border rounded px-2 py-1 text-sm bg-background" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">active</option>
                <option value="paused">paused</option>
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Nome do agente</Label>
                <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Ex.: Sofia" />
              </div>
              <div>
                <Label>Saudação inicial</Label>
                <Input value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder="Olá! Como posso ajudar?" />
              </div>
            </div>
            <div>
              <Label>Persona / instruções</Label>
              <Textarea
                rows={6}
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="Descreva o tom, o que o agente faz (ex.: agenda horários, responde dúvidas, informa preços), e o que NÃO deve fazer."
              />
            </div>
            <Button size="sm" onClick={saveAgent} disabled={savingAgent}>
              {savingAgent ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Salvar
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* AGENDA */}
      <TabsContent value="agenda">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disponibilidade semanal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {WEEKDAYS.map((wd, d) => (
                <div key={d} className="flex items-center gap-3">
                  <div className="w-24 flex items-center gap-2">
                    <Switch
                      checked={avail[d].on}
                      onCheckedChange={(v) => setAvail({ ...avail, [d]: { ...avail[d], on: v } })}
                    />
                    <span className="text-sm">{wd}</span>
                  </div>
                  <Input
                    type="time"
                    className="w-28"
                    value={avail[d].start}
                    disabled={!avail[d].on}
                    onChange={(e) => setAvail({ ...avail, [d]: { ...avail[d], start: e.target.value } })}
                  />
                  <span>—</span>
                  <Input
                    type="time"
                    className="w-28"
                    value={avail[d].end}
                    disabled={!avail[d].on}
                    onChange={(e) => setAvail({ ...avail, [d]: { ...avail[d], end: e.target.value } })}
                  />
                  <Input
                    type="number"
                    className="w-24"
                    value={avail[d].slot}
                    disabled={!avail[d].on}
                    onChange={(e) => setAvail({ ...avail, [d]: { ...avail[d], slot: Number(e.target.value) || 30 } })}
                  />
                  <span className="text-xs text-muted-foreground">min/slot</span>
                </div>
              ))}
              <Button size="sm" onClick={saveAvail} disabled={savingAvail}>
                {savingAvail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Salvar disponibilidade
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agendamentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 md:grid-cols-4">
                <Input type="datetime-local" value={apptWhen} onChange={(e) => setApptWhen(e.target.value)} />
                <Input placeholder="Cliente" value={apptName} onChange={(e) => setApptName(e.target.value)} />
                <Input placeholder="Telefone" value={apptPhone} onChange={(e) => setApptPhone(e.target.value)} />
                <Button size="sm" onClick={addAppt} disabled={addingAppt}>
                  {addingAppt ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Adicionar
                </Button>
              </div>
              <div className="divide-y">
                {appts.length === 0 && <p className="text-sm text-muted-foreground">Sem agendamentos.</p>}
                {appts.map((a) => (
                  <div key={a.id} className="py-2 flex items-center gap-3 text-sm">
                    <span className="w-40">{new Date(a.scheduled_at).toLocaleString("pt-BR")}</span>
                    <span className="flex-1">{a.customer_name || a.customer_phone || "—"}</span>
                    <Badge variant="outline">{a.source || "manual"}</Badge>
                    <Badge variant={a.status === "cancelled" ? "secondary" : "default"}>{a.status}</Badge>
                    <select
                      className="border rounded px-2 py-1 text-xs bg-background"
                      value={a.status}
                      onChange={(e) => setApptStatus(a.id, e.target.value)}
                    >
                      <option value="scheduled">scheduled</option>
                      <option value="confirmed">confirmed</option>
                      <option value="done">done</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* CANAIS */}
      <TabsContent value="canais">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Canais de atendimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>WhatsApp dedicado (1 número por cliente)</Label>
              <div className="mt-2">
                <TenantWhatsAppConnect tenantId={tenant.id} />
              </div>
            </div>

            <div className="pt-2 border-t">
              <Label>Widget de chat (site/landing)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input readOnly value={widgetKey} />
                <Button size="sm" variant="outline" onClick={regen}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Regerar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Cole este snippet no site do cliente:</p>
              <pre className="text-xs bg-muted rounded p-2 overflow-x-auto mt-1">{widgetSnippet}</pre>
              <p className="text-xs text-muted-foreground">(o widget.js é entregue na próxima etapa)</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
