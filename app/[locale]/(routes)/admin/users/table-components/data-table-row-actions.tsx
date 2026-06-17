"use client";

import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { adminUserSchema } from "../table-data/schema";
import { useRouter } from "next/navigation";
import AlertModal from "@/components/modals/alert-modal";
import { useState } from "react";
import { toast } from "sonner";

import { Copy, Edit, MoreHorizontal, Shield, Trash, UserCheck, UserX } from "lucide-react";
import { deleteUser } from "@/actions/admin/users/delete-user";
import { activateUser } from "@/actions/admin/users/activate-user";
import { deactivateUser } from "@/actions/admin/users/deactivate-user";
import { setUserRole } from "@/actions/admin/users/set-role";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const data = adminUserSchema.parse(row.original);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("A URL foi copiada para a área de transferência.");
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      const result = await deleteUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("Usuário excluído");
    } catch (error) {
      toast.error("Algo deu errado: " + error + ". Tente novamente.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const onActivate = async () => {
    try {
      setLoading(true);
      const result = await activateUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("Usuário ativado.");
    } catch (error) {
      toast.error("Algo deu errado ao ativar o usuário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const onDeactivate = async () => {
    try {
      setLoading(true);
      const result = await deactivateUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("Usuário desativado.");
    } catch (error) {
      toast.error("Algo deu errado ao desativar o usuário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const onSetRole = async (role: "admin" | "manager" | "user") => {
    try {
      setLoading(true);
      const result = await setUserRole(data.id, role);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success(`Função do usuário alterada para ${role}.`);
    } catch (error) {
      toast.error("Algo deu errado ao alterar a função. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"ghost"} className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onCopy(data?.id)}>
            <Copy className="mr-2 w-4 h-4" />
            Copiar ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onActivate()}>
            <UserCheck className="mr-2 w-4 h-4" />
            Ativar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDeactivate()}>
            <UserX className="mr-2 w-4 h-4" />
            Desativar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Shield className="mr-2 w-4 h-4" />
              Definir Função
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onSetRole("admin")}>
                Administrador
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRole("manager")}>
                Gerente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRole("user")}>
                Usuário
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="mr-2 w-4 h-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
