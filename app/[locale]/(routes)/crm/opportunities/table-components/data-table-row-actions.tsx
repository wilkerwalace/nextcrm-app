"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { opportunitySchema } from "../table-data/schema";
import { useRouter } from "next/navigation";
import AlertModal from "@/components/modals/alert-modal";
import { useState } from "react";
import { toast } from "sonner";
import { UpdateOpportunityForm } from "../components/UpdateOpportunityForm";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { deleteOpportunity } from "@/actions/crm/opportunities/delete-opportunity";

import type { OpportunityConfig } from "./columns";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  config: OpportunityConfig;
}

export function DataTableRowActions<TData>({
  row,
  config,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const opportunity = opportunitySchema.parse(row.original);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);


  const onDelete = async () => {
    setLoading(true);
    try {
      const result = await deleteOpportunity(opportunity?.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Oportunidade excluída com sucesso");
      }
    } catch (error) {
      toast.error("Algo deu errado ao excluir a oportunidade. Tente novamente.");
    } finally {
      setLoading(false);
      setOpen(false);
      router.refresh();
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
      <Sheet open={updateOpen} onOpenChange={setUpdateOpen}>
        <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Atualizar oportunidade - {opportunity?.name}</SheetTitle>
            <SheetDescription>Atualizar detalhes da oportunidade</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <UpdateOpportunityForm
              initialData={row.original}
              setOpen={setUpdateOpen}
              saleTypes={config.saleTypes}
              saleStages={config.saleStages}
              campaigns={config.campaigns}
              currencies={config.currencies}
            />
          </div>
        </SheetContent>
      </Sheet>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem
            onClick={() => router.push(`/crm/opportunities/${opportunity?.id}`)}
          >
            Ver
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setUpdateOpen(true)}>
            Atualizar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            Excluir
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
