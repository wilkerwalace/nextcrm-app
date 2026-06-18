"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, RefreshCw } from "lucide-react";
import {
  connectTenantWhatsApp,
  getTenantWhatsAppQr,
  getTenantWhatsAppStatus,
} from "@/actions/clientes/whatsapp";

export default function TenantWhatsAppConnect({ tenantId }: { tenantId: string }) {
  const [phone, setPhone] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState<{ connected?: boolean; loggedIn?: boolean; name?: string | null }>({});

  const refreshStatus = useCallback(async () => {
    const r = await getTenantWhatsAppStatus(tenantId);
    if (!(r as any).error) setStatus((r as any).data);
  }, [tenantId]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // enquanto não logado e há QR, faz polling do status
  useEffect(() => {
    if (status.loggedIn) return;
    const t = setInterval(refreshStatus, 4000);
    return () => clearInterval(t);
  }, [status.loggedIn, refreshStatus]);

  async function connect() {
    setConnecting(true);
    setQr(null);
    try {
      const r = await connectTenantWhatsApp(tenantId, phone || undefined);
      if ((r as any).error) {
        toast.error((r as any).error);
        return;
      }
      // busca QR algumas vezes
      for (let i = 0; i < 5; i++) {
        await new Promise((res) => setTimeout(res, 1500));
        const q = await getTenantWhatsAppQr(tenantId);
        if (!(q as any).error && (q as any).data.qr) {
          setQr((q as any).data.qr);
          break;
        }
      }
      refreshStatus();
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">Status:</span>
        {status.loggedIn ? (
          <Badge>Conectado{status.name ? ` (${status.name})` : ""}</Badge>
        ) : status.connected ? (
          <Badge variant="secondary">Conectando…</Badge>
        ) : (
          <Badge variant="outline">Desconectado</Badge>
        )}
        <Button size="sm" variant="ghost" onClick={refreshStatus}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {!status.loggedIn && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="w-48"
            placeholder="Telefone (opcional, com DDI)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button size="sm" onClick={connect} disabled={connecting}>
            {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <QrCode className="h-4 w-4 mr-2" />}
            Conectar / Gerar QR
          </Button>
        </div>
      )}

      {qr && !status.loggedIn && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-2">Abra o WhatsApp → Aparelhos conectados → Conectar aparelho e escaneie:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR WhatsApp" className="w-56 h-56 border rounded bg-white p-2" />
        </div>
      )}
    </div>
  );
}
