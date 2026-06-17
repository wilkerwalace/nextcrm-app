"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminFiltersProps {
  entityType?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function AdminFilters({
  entityType,
  action,
  dateFrom,
  dateTo,
}: AdminFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const apply = (overrides: Record<string, string>) => {
    // Start from current URL params so we don't drop unknown params
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // reset page on filter change
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const clear = () => router.push(pathname);

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <Select
        value={entityType ?? "all"}
        onValueChange={(v) => apply({ entityType: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Tipo de entidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as entidades</SelectItem>
          <SelectItem value="account">Empresa</SelectItem>
          <SelectItem value="contact">Contato</SelectItem>
          <SelectItem value="lead">Lead</SelectItem>
          <SelectItem value="opportunity">Oportunidade</SelectItem>
          <SelectItem value="contract">Contrato</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={action ?? "all"}
        onValueChange={(v) => apply({ action: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Ação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as ações</SelectItem>
          <SelectItem value="created">Criado</SelectItem>
          <SelectItem value="updated">Atualizado</SelectItem>
          <SelectItem value="deleted">Excluído</SelectItem>
          <SelectItem value="restored">Restaurado</SelectItem>
          <SelectItem value="relation_added">Relação adicionada</SelectItem>
          <SelectItem value="relation_removed">Relação removida</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          className="w-36"
          value={dateFrom ?? ""}
          onChange={(e) => apply({ dateFrom: e.target.value })}
          placeholder="De"
        />
        <span className="text-muted-foreground text-sm">até</span>
        <Input
          type="date"
          className="w-36"
          value={dateTo ?? ""}
          onChange={(e) => apply({ dateTo: e.target.value })}
          placeholder="Até"
        />
      </div>

      {(entityType || action || dateFrom || dateTo) && (
        <Button variant="ghost" size="sm" onClick={clear}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
