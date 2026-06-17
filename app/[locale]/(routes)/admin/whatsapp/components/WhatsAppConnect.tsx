"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, RefreshCw, Smartphone, CheckCircle2 } from "lucide-react";
import {
  connectWhatsApp,
  getWhatsAppQr,
  getWhatsAppStatus,
} from "@/actions/whatsapp/instance";

function qrToSrc(qr: string | null): string | null {
  if (!qr) return null;
  if (qr.startsWith("data:")) return qr;
  if (/^[A-Za-z0-9+/=]+$/.test(qr) && qr.length > 100) return `data:image/png;base64,${qr}`;
  return null; // é um "code" textual, não imagem
}

export default function WhatsAppConnect() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ exists: boolean; connected: boolean; loggedIn?: boolean; name?: string | null } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [phone, setPhone] = useState("");

  const refreshStatus = useCallback(async () => {
    const res = await getWhatsAppStatus();
    if (!(res as any).error) setStatus((res as any).data);
    return (res as any).data;
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // polling de QR/status enquanto conecta
  useEffect(() => {
    if (!polling) return;
    const iv = setInterval(async () => {
      const st = await refreshStatus();
      if (st?.loggedIn) {
        setPolling(false);
        setQr(null);
        toast.success("WhatsApp conectado!");
        return;
      }
      const q = await getWhatsAppQr();
      if (!(q as any).error && (q as any).data?.qr) setQr((q as any).data.qr);
    }, 4000);
    return () => clearInterval(iv);
  }, [polling, refreshStatus]);

  async function onConnect() {
    setLoading(true);
    setQr(null);
    try {
      const res = await connectWhatsApp(phone.trim() || undefined);
      if ((res as any).error) {
        toast.error((res as any).error);
      } else {
        toast.success("Conexão iniciada — escaneie o QR code");
        setPolling(true);
        const q = await getWhatsAppQr();
        if (!(q as any).error && (q as any).data?.qr) setQr((q as any).data.qr);
      }
    } catch (e: any) {
      toast.error(e?.message || "Falha ao conectar");
    } finally {
      setLoading(false);
    }
  }

  const connected = status?.loggedIn;
  const qrSrc = qrToSrc(qr);

  return (
    <div className="space-y-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" /> Conexão do número
          </CardTitle>
          <CardDescription>
            Conecte um número de WhatsApp escaneando o QR code (como no WhatsApp Web).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Status:</span>
            {connected ? (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Conectado {status?.name ? `(${status.name})` : ""}
              </span>
            ) : status?.connected ? (
              <span className="text-amber-600 font-medium">Conectando / aguardando leitura do QR</span>
            ) : (
              <span className="text-muted-foreground">Desconectado</span>
            )}
          </div>

          {!connected && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Telefone (opcional, com DDI — para pareamento por código)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="ex.: 5511999999999" />
              </div>
              <div className="flex gap-2">
                <Button onClick={onConnect} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Conectar / Gerar QR
                </Button>
                <Button variant="outline" onClick={() => refreshStatus()}>Atualizar status</Button>
              </div>
            </div>
          )}

          {!connected && qr && (
            <div className="rounded-lg border p-4 flex flex-col items-center gap-2">
              {qrSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrSrc} alt="QR code do WhatsApp" className="w-56 h-56" />
              ) : (
                <code className="text-xs break-all">{qr}</code>
              )}
              <p className="text-xs text-muted-foreground">
                Abra o WhatsApp no celular → Aparelhos conectados → Conectar um aparelho → escaneie.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
