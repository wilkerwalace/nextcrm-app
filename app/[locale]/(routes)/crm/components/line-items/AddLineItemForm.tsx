"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useAction } from "@/hooks/use-action";
import { FormInput } from "@/components/form/form-input";
import FormSheet from "@/components/sheets/form-sheet";
import { FormSubmit } from "@/components/form/form-submit";
import { FormTextarea } from "@/components/form/form-textarea";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unit_price: number;
}

interface AddLineItemFormProps {
  products: Product[];
  action: any;
  parentId: string;
  parentIdField: "opportunityId" | "contractId";
}

const AddLineItemForm = ({
  products,
  action,
  parentId,
  parentIdField,
}: AddLineItemFormProps) => {
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [discountType, setDiscountType] = useState<string>("NONE");
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const { execute, fieldErrors, isLoading } = useAction(action, {
    onSuccess: () => {
      toast.success("Item adicionado");
      closeRef.current?.click();
      router.refresh();
      setDiscountType("NONE");
      setSelectedProductId("");
    },
    onError: (error: string) => {
      toast.error(error);
    },
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const onAction = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const sku = (formData.get("sku") as string) || undefined;
    const quantity = parseInt((formData.get("quantity") as string) || "1", 10);
    const unit_price = formData.get("unit_price") as string;
    const description = (formData.get("description") as string) || undefined;
    const discount_value =
      discountType !== "NONE"
        ? (formData.get("discount_value") as string) || "0"
        : "0";

    await execute({
      [parentIdField]: parentId,
      productId: selectedProductId || undefined,
      name,
      sku,
      quantity,
      unit_price,
      discount_type:
        discountType === "NONE" ? "PERCENTAGE" : discountType,
      discount_value,
      sort_order: 0,
      description,
    });
  };

  return (
    <FormSheet
      trigger={"+"}
      title="Adicionar Item"
      description="Adicione um produto ou item personalizado"
      onClose={closeRef}
    >
      <form action={onAction} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-700">
            Produto (opcional)
          </label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">-- Selecione um produto --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.sku ? ` (${p.sku})` : ""}
              </option>
            ))}
          </select>
        </div>

        <FormInput
          id="name"
          label="Nome"
          type="text"
          errors={fieldErrors}
          defaultValue={selectedProduct?.name || ""}
          key={`name-${selectedProductId}`}
        />
        <FormInput
          id="sku"
          label="SKU"
          type="text"
          errors={fieldErrors}
          defaultValue={selectedProduct?.sku || ""}
          key={`sku-${selectedProductId}`}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="quantity"
            label="Quantidade"
            type="number"
            errors={fieldErrors}
            defaultValue="1"
          />
          <FormInput
            id="unit_price"
            label="Preço Unitário"
            type="text"
            errors={fieldErrors}
            defaultValue={
              selectedProduct ? String(selectedProduct.unit_price) : ""
            }
            key={`price-${selectedProductId}`}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-700">
            Tipo de Desconto
          </label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
          >
            <option value="NONE">Nenhum</option>
            <option value="PERCENTAGE">Porcentagem (%)</option>
            <option value="FIXED">Valor Fixo</option>
          </select>
        </div>

        {discountType !== "NONE" && (
          <FormInput
            id="discount_value"
            label={
              discountType === "PERCENTAGE"
                ? "Desconto (%)"
                : "Valor do Desconto"
            }
            type="text"
            errors={fieldErrors}
            defaultValue="0"
          />
        )}

        <FormTextarea
          id="description"
          label="Descrição"
          errors={fieldErrors}
        />

        <FormSubmit className="w-full">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            "Adicionar Item"
          )}
        </FormSubmit>
      </form>
    </FormSheet>
  );
};

export default AddLineItemForm;
