"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { generateDesignIdea } from "@/actions/crm/targets/design-idea";

export default function DesignIdeaButton({
  targetId,
  existing,
}: {
  targetId: string;
  existing?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [idea, setIdea] = useState<string | null>(existing || null);

  async function run() {
    setLoading(true);
    try {
      const res = await generateDesignIdea(targetId);
      if ((res as any).error) {
        toast.error((res as any).error);
      } else {
        setIdea((res as any).data.idea);
        toast.success("Ideia de design gerada");
      }
    } catch (e: any) {
      toast.error(e?.message || "Falha ao gerar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Ideia de design (IA)
        </CardTitle>
        <Button size="sm" onClick={run} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {idea ? "Gerar novamente" : "Gerar"}
        </Button>
      </CardHeader>
      <CardContent>
        {idea ? (
          <pre className="whitespace-pre-wrap text-sm font-sans">{idea}</pre>
        ) : (
          <p className="text-sm text-muted-foreground">
            Gera uma proposta de site/landing e uma abordagem por WhatsApp para este prospect (usa a IA do Dify).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
