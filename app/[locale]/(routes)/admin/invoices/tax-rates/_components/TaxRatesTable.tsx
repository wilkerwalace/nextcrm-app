"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

interface TaxRate {
  id: string;
  name: string;
  rate: string;
  isDefault: boolean;
  active: boolean;
}

interface TaxRatesTableProps {
  rates: TaxRate[];
}

export function TaxRatesTable({ rates }: TaxRatesTableProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [active, setActive] = useState(true);

  const resetForm = () => {
    setEditId(null);
    setName("");
    setRate("");
    setIsDefault(false);
    setActive(true);
  };

  const openEdit = (r: TaxRate) => {
    setEditId(r.id);
    setName(r.name);
    setRate(r.rate);
    setIsDefault(r.isDefault);
    setActive(r.active);
    setOpen(true);
  };

  const handleSave = async () => {
    const body = { name, rate: parseFloat(rate), isDefault, active };
    try {
      const url = editId
        ? `/api/admin/invoices/tax-rates/${editId}`
        : "/api/admin/invoices/tax-rates";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(editId ? "Alíquota atualizada" : "Alíquota criada");
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error("Falha ao salvar a alíquota");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta alíquota?")) return;
    try {
      const res = await fetch(`/api/admin/invoices/tax-rates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Alíquota excluída");
      router.refresh();
    } catch {
      toast.error("Falha ao excluir a alíquota");
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Alíquota %</TableHead>
            <TableHead>Padrão</TableHead>
            <TableHead>Ativa</TableHead>
            <TableHead className="w-20">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rates.map((r) => (
            <TableRow key={r.id} className={!r.active ? "opacity-50" : ""}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{r.rate}%</TableCell>
              <TableCell>{r.isDefault ? "Sim" : "Não"}</TableCell>
              <TableCell>{r.active ? "Ativa" : "Inativa"}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(r)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(r.id)}
                    disabled={r.isDefault}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {rates.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Nenhuma alíquota configurada
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
            + Adicionar Alíquota
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? "Editar Alíquota" : "Adicionar Alíquota"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="ex.: ICMS Padrão"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Alíquota %</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="ex.: 21"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
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
              disabled={!name || !rate}
            >
              {editId ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
