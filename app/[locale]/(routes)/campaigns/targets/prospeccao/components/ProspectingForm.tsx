"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { runProspecting } from "@/actions/crm/targets/prospect";

const COUNTRIES = [
  { value: "Portugal", label: "Portugal" },
  { value: "United States", label: "Estados Unidos" },
  { value: "Spain", label: "Espanha" },
  { value: "France", label: "França" },
  { value: "Italy", label: "Itália" },
  { value: "Germany", label: "Alemanha" },
  { value: "United Kingdom", label: "Reino Unido" },
  { value: "Ireland", label: "Irlanda" },
  { value: "Netherlands", label: "Países Baixos" },
  { value: "Belgium", label: "Bélgica" },
];

const GROUPS = [
  { key: "comercio", label: "Comércio / Lojas" },
  { key: "restaurantes", label: "Restaurantes / Cafés / Bares" },
  { key: "servicos", label: "Serviços / Escritórios" },
  { key: "saude", label: "Saúde" },
  { key: "beleza", label: "Beleza / Estética" },
  { key: "hospedagem", label: "Hospedagem / Turismo" },
];

type Result = {
  found: number;
  created: number;
  skipped: number;
  listName: string | null;
  location: string;
};

export default function ProspectingForm() {
  const router = useRouter();
  const [country, setCountry] = useState("Portugal");
  const [city, setCity] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [listName, setListName] = useState("");
  const [max, setMax] = useState(200);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const toggleGroup = (key: string) =>
    setGroups((g) => (g.includes(key) ? g.filter((x) => x !== key) : [...g, key]));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) {
      toast.error("Informe a cidade");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await runProspecting({
        country,
        city: city.trim(),
        groups,
        listName: listName.trim() || undefined,
        max: Number(max) || 200,
      });
      if ((res as any).error) {
        toast.error((res as any).error);
      } else {
        const d = (res as any).data as Result;
        setResult(d);
        toast.success(`${d.created} alvo(s) importado(s) (${d.skipped} já existiam)`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Falha na prospecção");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova prospecção</CardTitle>
          <CardDescription>
            Busca negócios reais por cidade e categoria. A triagem prioriza quem tem
            pouca presença digital (sem site/redes) — melhores oportunidades para
            oferecer site/landing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>País</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o país" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="ex.: Cascais, Lisboa, Porto, Miami..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categorias (vazio = todas)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {GROUPS.map((g) => (
                  <label
                    key={g.key}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={groups.includes(g.key)}
                      onCheckedChange={() => toggleGroup(g.key)}
                    />
                    {g.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Adicionar a uma lista (opcional)</Label>
                <Input
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="ex.: Prospecção Cascais — restaurantes"
                />
              </div>
              <div className="space-y-2">
                <Label>Limite de negócios</Label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={max}
                  onChange={(e) => setMax(Number(e.target.value))}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> Prospectar
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>{result.location}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-6 text-sm">
              <div>
                <div className="text-2xl font-semibold">{result.found}</div>
                <div className="text-muted-foreground">encontrados</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-green-600">{result.created}</div>
                <div className="text-muted-foreground">importados</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-muted-foreground">{result.skipped}</div>
                <div className="text-muted-foreground">já existiam</div>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push("/campaigns/targets")}>
              Ver alvos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
