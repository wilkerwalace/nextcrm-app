"use client";

import React from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";

const CopyKeyComponent = ({
  keyValue,
  envValue,
  message,
}: {
  keyValue?: string;
  envValue?: string;
  message: string;
}) => {
  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success(message + " - " + "copiado para a área de transferência");
  };

  return (
    <p
      className="flex gap-2 items-center"
      onClick={() => onCopy(keyValue || "")}
    >
      {keyValue ? keyValue : envValue ? envValue : "Não definido"}
      <Copy className="w-4 h-4" />
    </p>
  );
};

export default CopyKeyComponent;
