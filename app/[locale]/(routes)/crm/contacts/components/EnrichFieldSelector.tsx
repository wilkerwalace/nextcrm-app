"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { EnrichmentField } from "@/lib/enrichment/types";

const PRESET_FIELDS: EnrichmentField[] = [
  { name: "position",         displayName: "Cargo / Função",         description: "O cargo ou função do contato na empresa", type: "string", required: false },
  { name: "website",          displayName: "Site da Empresa",        description: "A URL do site oficial da empresa", type: "string", required: false },
  { name: "social_linkedin",  displayName: "URL do LinkedIn",        description: "A URL do perfil do contato ou da empresa no LinkedIn", type: "string", required: false },
  { name: "social_twitter",   displayName: "URL do Twitter / X",     description: "A URL do perfil do contato ou da empresa no Twitter/X", type: "string", required: false },
  { name: "social_facebook",  displayName: "URL do Facebook",        description: "A URL da página do contato ou da empresa no Facebook", type: "string", required: false },
  { name: "social_instagram", displayName: "URL do Instagram",       description: "A URL do perfil do contato ou da empresa no Instagram", type: "string", required: false },
  { name: "description",      displayName: "Descrição da Empresa",   description: "Uma breve descrição do que a empresa faz", type: "string", required: false },
  { name: "office_phone",     displayName: "Telefone Comercial",     description: "O número de telefone comercial da empresa ou do contato", type: "string", required: false },
  { name: "mobile_phone",     displayName: "Telefone Celular",       description: "O número de telefone celular do contato", type: "string", required: false },
];

interface EnrichFieldSelectorProps {
  onStart: (fields: EnrichmentField[]) => void;
  loading?: boolean;
  presetFields?: EnrichmentField[];
  defaultSelected?: string[];
}

export function EnrichFieldSelector({
  onStart,
  loading,
  presetFields = PRESET_FIELDS,
  defaultSelected = ["position", "social_linkedin", "website", "description"],
}: EnrichFieldSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected));
  const [customFields, setCustomFields] = useState<EnrichmentField[]>([]);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    const field: EnrichmentField = {
      name: customName.toLowerCase().replace(/\s+/g, "_"),
      displayName: customName.trim(),
      description: customDesc.trim() || `Encontrar ${customName.trim()} para este contato`,
      type: "string",
      required: false,
    };
    setCustomFields((prev) => [...prev, field]);
    setSelected((prev) => { const next = new Set(prev); next.add(field.name); return next; });
    setCustomName("");
    setCustomDesc("");
  };

  const removeCustom = (name: string) => {
    setCustomFields((prev) => prev.filter((f) => f.name !== name));
    setSelected((prev) => { const next = new Set(prev); next.delete(name); return next; });
  };

  const allFields = [...presetFields, ...customFields];
  const selectedFields = allFields.filter((f) => selected.has(f.name));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Selecione os dados a enriquecer. O Firecrawl pesquisará na web para encontrá-los.
      </p>

      <div className="space-y-2">
        {presetFields.map((field) => (
          <div key={field.name} className="flex items-center gap-2">
            <Checkbox
              id={field.name}
              checked={selected.has(field.name)}
              onCheckedChange={() => toggle(field.name)}
            />
            <Label htmlFor={field.name} className="cursor-pointer font-normal">
              {field.displayName}
            </Label>
          </div>
        ))}

        {customFields.map((field) => (
          <div key={field.name} className="flex items-center gap-2">
            <Checkbox
              id={field.name}
              checked={selected.has(field.name)}
              onCheckedChange={() => toggle(field.name)}
            />
            <Label htmlFor={field.name} className="cursor-pointer font-normal flex-1">
              {field.displayName}
            </Label>
            <Button variant="ghost" size="sm" onClick={() => removeCustom(field.name)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="border rounded-md p-3 space-y-2 bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground">Adicionar campo personalizado</p>
        <Input
          placeholder="Nome do campo (ex.: Número de funcionários)"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          className="h-8 text-sm"
        />
        <Input
          placeholder="Descrição (opcional)"
          value={customDesc}
          onChange={(e) => setCustomDesc(e.target.value)}
          className="h-8 text-sm"
        />
        <Button variant="outline" size="sm" onClick={addCustom} disabled={!customName.trim()}>
          <Plus className="h-3 w-3 mr-1" /> Adicionar campo
        </Button>
      </div>

      <Button
        className="w-full"
        disabled={selectedFields.length === 0 || loading}
        onClick={() => onStart(selectedFields)}
      >
        {loading ? "Iniciando…" : `Iniciar Enriquecimento (${selectedFields.length} campos)`}
      </Button>
    </div>
  );
}
