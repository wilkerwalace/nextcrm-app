"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { UploadCloud, Loader2 } from "lucide-react";

interface MinioUploaderProps {
  folder: "avatars" | "images" | "documents";
  accept?: Record<string, string[]>;
  maxSizeMB?: number;
  onUploadComplete: (url: string, key: string) => void;
  onUploadError?: (error: string) => void;
}

export function MinioUploader({
  folder,
  accept,
  maxSizeMB = 64,
  onUploadComplete,
  onUploadError,
}: MinioUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      setProgress("Solicitando URL de envio...");

      try {
        // Step 1: Get presigned URL from our server
        const res = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            folder,
          }),
        });

        if (!res.ok) throw new Error("Falha ao obter a URL de envio");
        const { presignedUrl, fileUrl, key } = await res.json();

        setProgress("Enviando...");

        // Step 2: PUT file directly to MinIO
        const uploadRes = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadRes.ok) throw new Error("Falha ao enviar para o armazenamento");

        setProgress(null);
        onUploadComplete(fileUrl, key);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha no envio";
        setProgress(null);
        onUploadError?.(msg);
      } finally {
        setUploading(false);
      }
    },
    [folder, onUploadComplete, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: maxSizeMB * 1024 * 1024,
    accept,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
        uploading && "opacity-60 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{progress}</p>
        </>
      ) : (
        <>
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? "Solte o arquivo aqui" : "Arraste e solte ou clique para enviar"}
          </p>
          <p className="text-xs text-muted-foreground/60">Máx. {maxSizeMB}MB</p>
        </>
      )}
    </div>
  );
}
