"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

interface Series {
  id: string;
  name: string;
  prefixTemplate: string;
  resetPolicy: string;
  isDefault: boolean;
  active: boolean;
}

interface SeriesTableProps {
  series: Series[];
}

const RESET_POLICIES = ["YEARLY", "MONTHLY", "NEVER"] as const;

export function SeriesTable({ series }: SeriesTableProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [prefixTemplate, setPrefixTemplate] = useState("");
  const [resetPolicy, setResetPolicy] = useState<string>("YEARLY");
  const [isDefault, setIsDefault] = useState(false);
  const [active, setActive] = useState(true);

  const resetForm = () => {
    setEditId(null);
    setName("");
    setPrefixTemplate("");
    setResetPolicy("YEARLY");
    setIsDefault(false);
    setActive(true);
  };

  const openEdit = (s: Series) => {
    setEditId(s.id);
    setName(s.name);
    setPrefixTemplate(s.prefixTemplate);
    setResetPolicy(s.resetPolicy);
    setIsDefault(s.isDefault);
    setActive(s.active);
    setOpen(true);
  };

  const handleSave = async () => {
    const body = { name, prefixTemplate, resetPolicy, isDefault, active };
    try {
      const url = editId
        ? `/api/admin/invoices/series/${editId}`
        : "/api/admin/invoices/series";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(editId ? "Série atualizada" : "Série criada");
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error("Falha ao salvar a série");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta série?")) return;
    try {
      const res = await fetch(`/api/admin/invoices/series/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Série excluída");
      router.refresh();
    } catch {
      toast.error("Falha ao excluir a série");
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Modelo de Prefixo</TableHead>
            <TableHead>Política de Reinício</TableHead>
            <TableHead>Padrão</TableHead>
            <TableHead>Ativa</TableHead>
            <TableHead className="w-20">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {series.map((s) => (
            <TableRow key={s.id} className={!s.active ? "opacity-50" : ""}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell className="font-mono text-sm">
                {s.prefixTemplate}
              </TableCell>
              <TableCell>{s.resetPolicy}</TableCell>
              <TableCell>{s.isDefault ? "Sim" : "Não"}</TableCell>
              <TableCell>{s.active ? "Ativa" : "Inativa"}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(s.id)}
                    disabled={s.isDefault}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {series.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Nenhuma série configurada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="mt-4">
            + Adicionar Série
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? "Editar Série" : "Adicionar Série"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="ex.: Faturas Padrão"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Modelo de Prefixo</Label>
              <Input
                placeholder="ex.: INV-{YYYY}-"
                value={prefixTemplate}
                onChange={(e) => setPrefixTemplate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use {"{YYYY}"} para o ano, {"{MM}"} para o mês
              </p>
            </div>
            <div className="space-y-2">
              <Label>Política de Reinício</Label>
              <Select value={resetPolicy} onValueChange={setResetPolicy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESET_POLICIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
              <Label>Padrão</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label>Ativa</Label>
            </div>
            <Button
              onClick={handleSave}
              disabled={!name || !prefixTemplate}
            >
              {editId ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
