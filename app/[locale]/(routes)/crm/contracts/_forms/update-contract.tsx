"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useRouter } from "next/navigation";

import { useAction } from "@/hooks/use-action";

import { updateContract } from "@/actions/crm/contracts/update-contract";

import FormSheetNoTrigger from "@/components/sheets/form-sheet-no-trigger";

import { FormInput } from "@/components/form/form-input";

import { FormSubmit } from "@/components/form/form-submit";
import { FormDatePicker } from "@/components/form/form-datepicker";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSelect } from "@/components/form/from-select";
import { UserSearchCombobox } from "@/components/ui/user-search-combobox";
import { getAccounts } from "@/actions/crm/accounts/get-accounts";
import { getCurrencies } from "@/actions/crm/get-currencies";

const UpdateContractForm = ({
  onOpen,
  setOpen,
  data,
}: {
  onOpen: boolean;
  setOpen: (open: boolean) => void;
  data: any;
}) => {
  const router = useRouter();
  const [assignedTo, setAssignedTo] = useState<string>(data.assigned_to ?? "");
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [currencies, setCurrencies] = useState<{ code: string; name: string; symbol: string }[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([getAccounts(), getCurrencies()])
      .then(([accountsResult, currenciesResult]) => {
        if ("data" in accountsResult && accountsResult.data) {
          setAccounts(accountsResult.data);
        }
        if ("data" in currenciesResult && currenciesResult.data) {
          setCurrencies(currenciesResult.data);
        }
      })
      .finally(() => setIsLoadingData(false));
  }, []);

  const contractStatuses = [
    { id: "NOTSTARTED", name: "Não iniciado" },
    { id: "INPROGRESS", name: "Em andamento" },
    { id: "SIGNED", name: "Assinado" },
  ];

  const valueString = data && data.value ? data.value.toString() : "";

  const { execute, fieldErrors, isLoading } = useAction(updateContract, {
    onSuccess: () => {
      toast.success("Contrato atualizado com sucesso!");
      setOpen(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onAction = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const value = formData.get("value") as string;
    const startDate = new Date(formData.get("startDate") as string);
    const endDate = new Date(formData.get("endDate") as string);
    const renewalReminderDate = new Date(
      formData.get("renewalReminderDate") as string
    );
    const customerSignedDate = new Date(
      formData.get("customerSignedDate") as string
    );
    const companySignedDate = new Date(
      formData.get("companySignedDate") as string
    );
    const description = formData.get("description") as string;
    const status = formData.get("status") as any;
    const account = formData.get("account") as string;
    const assigned_to = formData.get("assigned_to") as string;
    const currency = formData.get("currency") as string;

    await execute({
      id: data.id,
      v: data.v,
      title,
      value,
      startDate,
      endDate,
      renewalReminderDate,
      customerSignedDate,
      companySignedDate,
      description,
      status,
      account,
      assigned_to,
      currency,
    });
  };

  return (
    <FormSheetNoTrigger
      title="Atualizar contrato"
      description="Atualize os detalhes, datas, status e atribuições do contrato"
      open={onOpen}
      setOpen={setOpen}
    >
      {isLoadingData ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <form action={onAction} className="space-y-4">
          <FormInput
            id="title"
            label="Título"
            type="text"
            errors={fieldErrors}
            defaultValue={data.title}
          />
          <FormInput
            id="value"
            label="Valor"
            type="text"
            errors={fieldErrors}
            defaultValue={valueString}
          />
          <FormSelect
            id="currency"
            label="Moeda"
            type="hidden"
            data={currencies.map((c) => ({
              id: c.code,
              name: `${c.symbol} ${c.code} — ${c.name}`,
            }))}
            errors={fieldErrors}
            defaultValue={data.currency ?? ""}
          />
          <FormDatePicker
            id="startDate"
            label="Data de início"
            type="hidden"
            errors={fieldErrors}
            defaultValue={data.startDate}
          />
          <FormDatePicker
            id="endDate"
            label="Data de término"
            type="hidden"
            errors={fieldErrors}
            defaultValue={data.endDate}
          />
          <FormDatePicker
            id="renewalReminderDate"
            label="Data de lembrete de renovação"
            type="hidden"
            errors={fieldErrors}
            defaultValue={data.renewalReminderDate}
          />
          <FormDatePicker
            id="customerSignedDate"
            label="Data de assinatura do cliente"
            type="hidden"
            errors={fieldErrors}
            defaultValue={data.customerSignedDate}
          />
          <FormDatePicker
            id="companySignedDate"
            label="Data de assinatura da empresa"
            type="hidden"
            errors={fieldErrors}
            defaultValue={data.companySignedDate}
          />
          <FormTextarea
            id="description"
            label="Descrição"
            errors={fieldErrors}
            defaultValue={data.description}
          />
          <FormSelect
            id="status"
            label="Status"
            type="hidden"
            data={contractStatuses}
            errors={fieldErrors}
            defaultValue={data.status}
          />
          <FormSelect
            id="account"
            label="Empresa"
            type="hidden"
            data={accounts}
            errors={fieldErrors}
            defaultValue={data.account}
          />
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-700">
              Responsável
            </label>
            <UserSearchCombobox
              value={assignedTo}
              onChange={setAssignedTo}
              placeholder="Selecione o usuário responsável"
              name="assigned_to"
            />
          </div>
          <FormSubmit className="w-full">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              "Atualizar"
            )}
          </FormSubmit>
        </form>
      )}
    </FormSheetNoTrigger>
  );
};

export default UpdateContractForm;
