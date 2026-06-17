"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

interface EnrichButtonProps {
  targetId: string;
}

export function EnrichButton({ targetId }: EnrichButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleEnrich() {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/targets/${targetId}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Enriquecimento iniciado — você será notificado quando concluir");
    } catch {
      toast.error("Falha ao iniciar o enriquecimento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEnrich}
      disabled={loading}
      title="Enriquecer com IA"
    >
      <Sparkles className="h-4 w-4 mr-1 text-orange-500" />
      {loading ? "Iniciando…" : "Enriquecer com IA"}
    </Button>
  );
}
