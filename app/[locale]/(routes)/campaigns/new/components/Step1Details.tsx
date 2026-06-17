"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Props = {
  initialData: {
    name?: string;
    description?: string;
    from_name?: string;
    reply_to?: string;
  };
  onNext: (data: {
    name: string;
    description?: string;
    from_name?: string;
    reply_to?: string;
  }) => void;
};

export function Step1Details({ initialData, onNext }: Props) {
  const [name, setName] = useState(initialData.name ?? "");
  const [description, setDescription] = useState(
    initialData.description ?? ""
  );
  const [fromName, setFromName] = useState(initialData.from_name ?? "");
  const [replyTo, setReplyTo] = useState(initialData.reply_to ?? "");
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!name.trim()) {
      setError("O nome da campanha é obrigatório");
      return;
    }
    onNext({
      name: name.trim(),
      description: description || undefined,
      from_name: fromName || undefined,
      reply_to: replyTo || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome da Campanha *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="ex.: Prospecção de Produto do 2º Trimestre"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição opcional..."
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fromName">Nome do Remetente</Label>
        <Input
          id="fromName"
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          placeholder="ex.: Joana da Acme"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="replyTo">E-mail de Resposta</Label>
        <Input
          id="replyTo"
          value={replyTo}
          onChange={(e) => setReplyTo(e.target.value)}
          placeholder="reply@yourcompany.com"
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleNext}>Avançar →</Button>
      </div>
    </div>
  );
}
