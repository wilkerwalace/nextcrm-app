"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ApiKeyProvider } from "@prisma/client";
import type { UserProviderStatus } from "../../actions/api-keys";
import {
  upsertUserApiKey,
  deleteUserApiKey,
} from "../../actions/api-keys";

type Props = {
  initialKeys: UserProviderStatus[];
};

const PROVIDER_META: Record<
  ApiKeyProvider,
  { label: string; description: string }
> = {
  OPENAI: {
    label: "OpenAI",
    description: "Usado para enriquecimento com GPT-4 e embeddings",
  },
  FIRECRAWL: {
    label: "Firecrawl",
    description: "Usado para coleta de dados da web durante o enriquecimento",
  },
  ANTHROPIC: {
    label: "Anthropic",
    description: "Modelos Claude",
  },
  GROQ: {
    label: "Groq",
    description: "Inferência rápida",
  },
};

function ProviderRow({ status }: { status: UserProviderStatus }) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const meta = PROVIDER_META[status.provider];

  const handleSave = () => {
    if (!value.trim()) {
      toast.error("Insira uma chave de API.");
      return;
    }
    startTransition(async () => {
      try {
        await upsertUserApiKey(status.provider, value.trim());
        toast.success(`Chave de API do ${meta.label} salva.`);
        setValue("");
      } catch {
        toast.error(`Falha ao salvar a chave de API do ${meta.label}.`);
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      try {
        await deleteUserApiKey(status.provider);
        toast.success(`Chave de API do ${meta.label} removida.`);
      } catch {
        toast.error(`Falha ao remover a chave de API do ${meta.label}.`);
      }
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-card-foreground">
          {meta.label}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {meta.description}
        </p>
      </div>

      {status.higherTierActive && (
        <p className="text-xs text-muted-foreground mb-3 italic">
          Uma chave global do sistema está ativa — sua chave não está em uso.
          {status.maskedKey && (
            <span className="ml-1 font-mono">{status.maskedKey}</span>
          )}
        </p>
      )}

      {!status.higherTierActive && status.maskedKey && (
        <p className="text-xs text-muted-foreground mb-3">
          Chave atual:{" "}
          <span className="font-mono">{status.maskedKey}</span>
        </p>
      )}

      <div className="flex items-center gap-3">
        <Input
          type="password"
          placeholder={`Insira a chave de API do ${meta.label}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isPending}
          className="max-w-sm"
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending}
        >
          Salvar
        </Button>
        {status.source === "USER_SET" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRemove}
            disabled={isPending}
          >
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}

export function LlmsTabContent({ initialKeys }: Props) {
  return (
    <div className="space-y-4">
      {initialKeys.map((status) => (
        <ProviderRow key={status.provider} status={status} />
      ))}
    </div>
  );
}
