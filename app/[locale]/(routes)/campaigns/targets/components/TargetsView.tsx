"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { columns } from "../table-components/columns";
import { NewTargetForm } from "./NewTargetForm";
import { TargetsDataTable } from "../table-components/data-table";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ImportTargetsModal from "@/components/modals/ImportTargetsModal";

const TargetsView = ({ data }: any) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between">
          <div>
            <CardTitle
              onClick={() => router.push("/crm/targets")}
              className="cursor-pointer"
            >
              Alvos
            </CardTitle>
            <CardDescription></CardDescription>
          </div>
          <div className="flex space-x-2">
            <ImportTargetsModal />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button size="sm">+ Novo Alvo</Button>
              </SheetTrigger>
              <SheetContent className="max-w-2xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Criar novo Alvo</SheetTitle>
                  <SheetDescription>
                    Adicione um novo alvo ao seu CRM.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <NewTargetForm onFinish={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <Separator />
      </CardHeader>

      <CardContent>
        {!data || data.length === 0 ? (
          "Nenhum alvo encontrado"
        ) : (
          <TargetsDataTable data={data} columns={columns} />
        )}
      </CardContent>
    </Card>
  );
};

export default TargetsView;
