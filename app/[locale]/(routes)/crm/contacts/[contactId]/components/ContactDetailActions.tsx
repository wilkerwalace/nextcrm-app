"use client";

import { useState } from "react";
import { MoreHorizontal, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UpdateContactForm } from "../../components/UpdateContactForm";
import { sendWhatsApp } from "@/actions/whatsapp/send-message";

type ConfigItem = { id: string; name: string };

interface ContactDetailActionsProps {
  contact: any;
  contactTypes: ConfigItem[];
}

export function ContactDetailActions({
  contact,
  contactTypes,
}: ContactDetailActionsProps) {
  const [updateOpen, setUpdateOpen] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const [waText, setWaText] = useState("");
  const [waSending, setWaSending] = useState(false);

  const phone = (contact?.mobile_phone || contact?.office_phone) as string | undefined;

  async function handleSendWhatsApp() {
    if (!phone) {
      toast.error("Este contato não tem telefone");
      return;
    }
    if (!waText.trim()) {
      toast.error("Escreva a mensagem");
      return;
    }
    setWaSending(true);
    try {
      const res = await sendWhatsApp({
        number: phone,
        text: waText.trim(),
        contactId: contact.id,
        name: [contact.first_name, contact.last_name].filter(Boolean).join(" ") || undefined,
      });
      if ((res as any).error) {
        toast.error((res as any).error);
      } else {
        toast.success("WhatsApp enviado");
        setWaText("");
        setWaOpen(false);
      }
    } catch (e: any) {
      toast.error(e?.message || "Falha ao enviar");
    } finally {
      setWaSending(false);
    }
  }

  return (
    <>
      <Sheet open={updateOpen} onOpenChange={setUpdateOpen}>
        <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Atualizar Contato - {contact?.first_name} {contact?.last_name}
            </SheetTitle>
            <SheetDescription>Atualizar detalhes do contato</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <UpdateContactForm
              initialData={contact}
              setOpen={setUpdateOpen}
              contactTypes={contactTypes}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={waOpen} onOpenChange={setWaOpen}>
        <SheetContent className="w-full md:max-w-[480px]">
          <SheetHeader>
            <SheetTitle>Enviar WhatsApp</SheetTitle>
            <SheetDescription>
              Para {contact?.first_name} {contact?.last_name} {phone ? `(${phone})` : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {!phone && (
              <p className="text-sm text-amber-600">Este contato não tem telefone cadastrado.</p>
            )}
            <Textarea
              rows={5}
              placeholder="Escreva sua mensagem..."
              value={waText}
              onChange={(e) => setWaText(e.target.value)}
              disabled={!phone || waSending}
            />
            <Button onClick={handleSendWhatsApp} disabled={!phone || waSending}>
              {waSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
              Enviar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            data-testid="contact-detail-actions-btn"
          >
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={() => setUpdateOpen(true)}>
            Atualizar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setWaOpen(true)} disabled={!phone}>
            <MessageCircle className="mr-2 h-4 w-4" /> Enviar WhatsApp
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
