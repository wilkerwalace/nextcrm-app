"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createActivity } from "@/actions/crm/activities/create-activity";
import { updateActivity } from "@/actions/crm/activities/update-activity";
import type { ActivityWithLinks } from "@/actions/crm/activities/get-activities-by-entity";

type ActivityType = "call" | "meeting" | "note" | "email";
type ActivityStatus = "scheduled" | "completed" | "cancelled";

const DEFAULT_STATUS: Record<ActivityType, ActivityStatus> = {
  call: "scheduled",
  meeting: "scheduled",
  note: "completed",
  email: "completed",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: string;
  activity?: ActivityWithLinks; // if provided: edit mode
  onSaved: (activity: ActivityWithLinks) => void;
}

export function ActivityForm({ open, onOpenChange, entityType, entityId, activity, onSaved }: Props) {
  const isEdit = !!activity;

  const [type, setType] = useState<ActivityType>(activity?.type ?? "call");
  const [title, setTitle] = useState(activity?.title ?? "");
  const [description, setDescription] = useState(activity?.description ?? "");
  const [date, setDate] = useState(
    activity ? new Date(activity.date).toISOString().slice(0, 16) : ""
  );
  const [status, setStatus] = useState<ActivityStatus>(activity?.status ?? "scheduled");
  const [duration, setDuration] = useState(activity?.duration?.toString() ?? "");
  const [outcome, setOutcome] = useState(activity?.outcome ?? "");
  const [emailSubject, setEmailSubject] = useState(
    (activity?.metadata as Record<string, string> | null)?.subject ?? ""
  );
  const [saving, setSaving] = useState(false);

  // Auto-set status when type changes (only in create mode)
  useEffect(() => {
    if (!isEdit) {
      setStatus(DEFAULT_STATUS[type]);
    }
  }, [type, isEdit]);

  const showDuration = type === "call" || type === "meeting";
  const showOutcome = type === "call" || type === "meeting";
  const showEmailSubject = type === "email";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }
    if (!date) {
      toast.error("A data é obrigatória");
      return;
    }

    setSaving(true);

    const metadata: Record<string, unknown> = {};
    if (showEmailSubject && emailSubject) metadata.subject = emailSubject;

    const payload = {
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      date: new Date(date),
      duration: showDuration && duration ? parseInt(duration, 10) : undefined,
      outcome: showOutcome && outcome.trim() ? outcome.trim() : undefined,
      status,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      links: [{ entityType, entityId }],
    };

    let result: { data?: ActivityWithLinks; error?: string };

    if (isEdit) {
      result = await updateActivity({ id: activity.id, ...payload });
    } else {
      result = await createActivity(payload);
    }

    setSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      toast.success(isEdit ? "Atividade atualizada" : "Atividade registrada");
      onSaved(result.data as ActivityWithLinks);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar atividade" : "Registrar atividade"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-1">
            <Label htmlFor="activity-type">Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
              <SelectTrigger id="activity-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Ligação</SelectItem>
                <SelectItem value="meeting">Reunião</SelectItem>
                <SelectItem value="note">Nota</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="activity-title">Título *</Label>
            <Input
              id="activity-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descrição breve"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="activity-date">Data e hora *</Label>
            <Input
              id="activity-date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="activity-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ActivityStatus)}>
              <SelectTrigger id="activity-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Agendada</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showDuration && (
            <div className="space-y-1">
              <Label htmlFor="activity-duration">Duração (minutos)</Label>
              <Input
                id="activity-duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="ex. 30"
              />
            </div>
          )}

          {showOutcome && (
            <div className="space-y-1">
              <Label htmlFor="activity-outcome">Resultado</Label>
              <Input
                id="activity-outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Resultado da ligação / reunião"
              />
            </div>
          )}

          {showEmailSubject && (
            <div className="space-y-1">
              <Label htmlFor="activity-email-subject">Assunto do e-mail</Label>
              <Input
                id="activity-email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Linha de assunto"
              />
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="activity-description">Notas</Label>
            <Textarea
              id="activity-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas adicionais..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Registrar atividade"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
