"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import React, { useEffect, useState } from "react";
import { deleteProject } from "@/actions/projects/delete-project";

type Props = {
  boardId: string;
  boardName: string;
};

const DeleteProjectDialog = ({ boardId, boardName }: Props) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  //Actions

  const onDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteProject(boardId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Projeto: ${boardName} excluído com sucesso`);
      }
    } catch (error) {
      toast.error("Algo deu errado ao excluir o projeto. Tente novamente.");
    } finally {
      setOpen(false);
      setIsLoading(false);
      router.refresh();
      router.push("/projects");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="px-2" variant={"destructive"} asChild>
          <div className="px-3 gap-2">
            Excluir projeto
            <TrashIcon size={15} />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir projeto</DialogTitle>
          <DialogDescription>
            Tem certeza de que deseja excluir este projeto? Você não poderá
            recuperá-lo. Todas as tarefas também serão excluídas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            {isLoading ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteProjectDialog;
