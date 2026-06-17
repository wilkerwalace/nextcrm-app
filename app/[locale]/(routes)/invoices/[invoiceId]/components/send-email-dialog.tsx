"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send } from "lucide-react";
import { sendInvoiceEmail } from "@/actions/invoices/send-invoice-email";

interface SendEmailDialogProps {
  invoiceId: string;
  defaultEmail?: string;
}

export function SendEmailDialog({
  invoiceId,
  defaultEmail,
}: SendEmailDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [to, setTo] = useState(defaultEmail ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!to) {
      toast.error("O endereço de e-mail é obrigatório");
      return;
    }
    setSending(true);
    try {
      await sendInvoiceEmail({
        invoiceId,
        to,
        subject: subject || undefined,
        message: message || undefined,
      });
      toast.success("Fatura enviada por e-mail");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Falha ao enviar o e-mail");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Send className="mr-2 h-4 w-4" />
          Enviar por e-mail
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar fatura por e-mail</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Para</Label>
            <Input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Assunto (opcional)</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto personalizado"
            />
          </div>
          <div className="space-y-2">
            <Label>Mensagem (opcional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mensagem opcional a incluir"
              rows={3}
            />
          </div>
          <Button onClick={handleSend} disabled={sending || !to}>
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
