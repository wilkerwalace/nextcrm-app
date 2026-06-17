"use client";

import { Button } from "@/components/ui/button";
import ModalDocumentView from "../ui/modal-document-view";
import Link from "next/link";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  document: any;
}

const DocumentViewModal = ({
  isOpen,
  onClose,
  loading,
  document,
}: AlertModalProps) => {

  const imageTypes = [
    "application/png",
    "application/jpg",
    "application/jpeg",
    "application/gif",
    "images/png",
    "images/jpg",
    "images/jpeg",
    "images/gif",
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/gif",
    "image/webp",
  ];

  console.log(document.document_file_mimeType, "mimeType");

  if (imageTypes.includes(document.document_file_mimeType)) {
    const imageUrl = document.document_file_url || "";
    return (
      <ModalDocumentView isOpen={isOpen} onClose={onClose}>
        <div className="flex flex-col h-full ">
          <div className="relative h-full p-10">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Pré-visualização da imagem" src={imageUrl} className="object-contain w-full h-full" />
            ) : (
              <p className="text-muted-foreground">Pré-visualização indisponível</p>
            )}
          </div>
          <div className="pt-6 space-x-2 flex items-center justify-end w-full ">
            <Button disabled={loading} variant={"outline"} onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </ModalDocumentView>
    );
  }

  if (document.document_file_mimeType === "application/pdf") {
    return (
      <ModalDocumentView isOpen={isOpen} onClose={onClose}>
        <div className="flex flex-col h-full ">
          <embed
            style={{
              width: "100%",
              height: "100%",
            }}
            type="application/pdf"
            src={document.document_file_url}
          />
          <div className="pt-6 space-x-2 flex items-center justify-end w-full ">
            <Button disabled={loading} variant={"outline"} onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </ModalDocumentView>
    );
  } else {
    return (
      <ModalDocumentView isOpen={isOpen} onClose={onClose}>
        <div className="flex flex-col h-full ">
          Este formato não pode ser pré-visualizado. Baixe o arquivo para visualizá-lo.
          <Button>
            <Link href={document.document_file_url}> Baixar</Link>
          </Button>
          <div className="pt-6 space-x-2 flex items-center justify-end w-full ">
            <Button disabled={loading} variant={"outline"} onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </ModalDocumentView>
    );
  }
};

export default DocumentViewModal;
