"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Building2 } from "lucide-react";
import { createTenant } from "@/actions/clientes/tenants";

export default function ClientesClient({ tenants }: { tenants: any[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!name.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    setSaving(true);
    try {
      const r = await createTenant({
        name: name.trim(),
        contact_name: contactName.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
      });
      if ((r as any).error) toast.error((r as any).error);
      else {
        toast.success("Cliente criado");
        router.push(`/clientes/${(r as any).data.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setOpen((v) => !v)} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Novo cliente
        </Button>
      </div>

      {open && (
        <Card>
          <CardContent className="pt-6 grid gap-3 md:grid-cols-3">
            <Input placeholder="Nome do cliente/empresa" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Contato (nome)" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            <Input placeholder="Telefone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            <div className="md:col-span-3">
              <Button onClick={create} disabled={saving} size="sm">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Criar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tenants.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum cliente ainda. Crie o primeiro.</p>
        )}
        {tenants.map((t) => (
          <Link key={t.id} href={`/clientes/${t.id}`}>
            <Card className="hover:bg-muted/50 transition">
              <CardContent className="pt-6 flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.contact_name || t.contact_phone || t.slug}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Badge variant={t.status === "active" ? "default" : "secondary"}>{t.status}</Badge>
                    {t.agent_enabled && <Badge variant="outline">Agente</Badge>}
                    <Badge variant="outline">{t._count?.appointments ?? 0} agend.</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
