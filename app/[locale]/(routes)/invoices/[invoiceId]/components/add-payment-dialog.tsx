"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addPayment } from "@/actions/invoices/add-payment";

const PAYMENT_METHODS = [
  "Bank Transfer",
  "Cash",
  "Card",
  "Check",
  "PayPal",
  "Other",
];

interface AddPaymentDialogProps {
  invoiceId: string;
  balanceDue: string;
  currency: string;
}

export function AddPaymentDialog({
  invoiceId,
  balanceDue,
  currency,
}: AddPaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState(balanceDue);
  const [paidAt, setPaidAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [method, setMethod] = useState("Bank Transfer");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await addPayment({
        invoiceId,
        amount: parseFloat(amount),
        paidAt: new Date(paidAt).toISOString(),
        method,
        reference: reference || null,
        note: note || null,
      });
      toast.success("Pagamento registrado");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Falha ao adicionar o pagamento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Adicionar pagamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Adicionar pagamento ({currency} {balanceDue} em aberto)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Valor</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Método</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Referência</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Referência da transação"
            />
          </div>
          <div className="space-y-2">
            <Label>Observação</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Observação opcional"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={saving || !amount || parseFloat(amount) <= 0}
          >
            {saving ? "Salvando..." : "Registrar pagamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
