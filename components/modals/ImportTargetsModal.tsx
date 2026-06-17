"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { importTargets } from "@/actions/crm/targets/import-targets";
import { suggestMapping } from "@/actions/crm/targets/suggest-mapping";
import Papa from "papaparse";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";

type Step = "upload" | "mapping" | "preview";

interface TargetField {
  key: string;
  label: string;
  required: boolean;
}

const TARGET_FIELDS: TargetField[] = [
  { key: "last_name", label: "Sobrenome", required: false },
  { key: "first_name", label: "Nome", required: false },
  { key: "email", label: "E-mail", required: false },
  { key: "mobile_phone", label: "Celular", required: false },
  { key: "office_phone", label: "Telefone comercial", required: false },
  { key: "company", label: "Empresa", required: false },
  { key: "position", label: "Cargo", required: false },
  { key: "company_website", label: "Site da empresa", required: false },
  { key: "personal_website", label: "Site pessoal", required: false },
  { key: "social_linkedin", label: "LinkedIn", required: false },
  { key: "social_x", label: "X / Twitter", required: false },
  { key: "social_instagram", label: "Instagram", required: false },
  { key: "social_facebook", label: "Facebook", required: false },
  { key: "personal_email", label: "E-mail pessoal", required: false },
  { key: "company_email",  label: "E-mail da empresa",  required: false },
  { key: "company_phone",  label: "Telefone da empresa",  required: false },
  { key: "city",           label: "Cidade",           required: false },
  { key: "country",        label: "País",          required: false },
  { key: "industry",       label: "Setor",       required: false },
  { key: "employees",      label: "Funcionários",      required: false },
  { key: "description",    label: "Descrição",    required: false },
];

const SKIP_VALUE = "__skip__";

const ImportTargetsModal = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  // mapping: targetField -> csvHeader (or SKIP_VALUE)
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const resetState = () => {
    setStep("upload");
    setSelectedFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setIsLoading(false);
    setIsSuggesting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) resetState();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        setCsvHeaders(headers);
        setCsvRows(results.data);
        fetchSuggestedMapping(headers);
      },
    });
  };

  const fetchSuggestedMapping = useCallback(async (headers: string[]) => {
    setIsSuggesting(true);
    setStep("mapping");
    try {
      const res = await suggestMapping(headers);
      const suggested: Record<string, string | null> = res.mapping ?? {};
      // Convert from { csvHeader -> targetField } to { targetField -> csvHeader }
      const newMapping: Record<string, string> = {};
      for (const field of TARGET_FIELDS) {
        newMapping[field.key] = SKIP_VALUE;
      }
      for (const [csvHeader, targetField] of Object.entries(suggested)) {
        if (targetField && newMapping[targetField] === SKIP_VALUE) {
          newMapping[targetField] = csvHeader;
        }
      }
      setMapping(newMapping);
    } catch {
      // Set all to skip on error
      const newMapping: Record<string, string> = {};
      for (const field of TARGET_FIELDS) {
        newMapping[field.key] = SKIP_VALUE;
      }
      setMapping(newMapping);
    } finally {
      setIsSuggesting(false);
    }
  }, []);

  const computePreview = () => {
    let valid = 0;
    let skipped = 0;
    const skipReasons: string[] = [];

    for (let i = 0; i < csvRows.length; i++) {
      const raw = csvRows[i];
      const row: Record<string, string> = {};
      for (const field of TARGET_FIELDS) {
        const csvCol = mapping[field.key];
        if (csvCol && csvCol !== SKIP_VALUE) {
          row[field.key] = raw[csvCol] ?? "";
        }
      }

      if (!row.last_name && !row.company) {
        skipped++;
        if (skipReasons.length < 3) skipReasons.push(`Linha ${i + 2}: sobrenome ou empresa ausente`);
        continue;
      }
      valid++;
    }

    return { valid, skipped, skipReasons };
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setIsLoading(true);

    // Build mapping as { csvHeader -> targetField } for the API
    const apiMapping: Record<string, string> = {};
    for (const [targetField, csvCol] of Object.entries(mapping)) {
      if (csvCol && csvCol !== SKIP_VALUE) {
        apiMapping[csvCol] = targetField;
      }
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("mapping", JSON.stringify(apiMapping));

    try {
      const { imported, skipped, errors } = await importTargets(formData);
      toast.success(`Importados: ${imported}, Ignorados: ${skipped}${errors.length > 0 ? `. Erros: ${errors.slice(0, 3).join("; ")}` : ""}`);
      setOpen(false);
      resetState();
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  };

  const preview = step === "preview" ? computePreview() : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Importar alvos de CSV
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              Etapa {step === "upload" ? 1 : step === "mapping" ? 2 : 3} de 3
            </span>
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Selecione um arquivo CSV para importar alvos."}
            {step === "mapping" && "Mapeie as colunas do seu CSV para os campos de alvo. A IA pré-preencheu sugestões — ajuste conforme necessário."}
            {step === "preview" && "Revise o resumo da importação antes de prosseguir."}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4 py-2">
            <div className="border-2 border-dashed rounded-md p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Selecionar arquivo CSV
              </Button>
              {selectedFile && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selecionado: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Map Columns */}
        {step === "mapping" && (
          <div className="space-y-3 py-2">
            {isSuggesting ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>A IA está sugerindo os mapeamentos de colunas…</span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground px-1 pb-1">
                  <span>Campo do CRM</span>
                  <span>Coluna do CSV</span>
                </div>
                {TARGET_FIELDS.map((field) => (
                  <div key={field.key} className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </span>
                    <Select
                      value={mapping[field.key] ?? SKIP_VALUE}
                      onValueChange={(val) =>
                        setMapping((prev) => ({ ...prev, [field.key]: val }))
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="— ignorar —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SKIP_VALUE}>— ignorar —</SelectItem>
                        {csvHeaders.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  <span className="text-destructive">*</span> sobrenome ou empresa é obrigatório por linha.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && preview && (
          <div className="space-y-4 py-2">
            <div className="rounded-md border p-4 space-y-1">
              <p className="text-sm font-medium">
                Pronto para importar{" "}
                <span className="text-green-600 dark:text-green-400">
                  {preview.valid} linha{preview.valid !== 1 ? "s" : ""}
                </span>
                {preview.skipped > 0 && (
                  <>
                    {" "}— {" "}
                    <span className="text-yellow-600 dark:text-yellow-400">
                      {preview.skipped} linha{preview.skipped !== 1 ? "s" : ""} {preview.skipped !== 1 ? "serão" : "será"} ignorada{preview.skipped !== 1 ? "s" : ""}
                    </span>
                  </>
                )}
                .
              </p>
              {preview.skipReasons.length > 0 && (
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5 pt-1">
                  {preview.skipReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                  {preview.skipped > preview.skipReasons.length && (
                    <li>…e mais {preview.skipped - preview.skipReasons.length}</li>
                  )}
                </ul>
              )}
            </div>
            {preview.valid === 0 && (
              <p className="text-sm text-destructive">
                Nenhuma linha válida para importar. Volte e ajuste o mapeamento de colunas.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-0">
          {step === "upload" && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
          )}

          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Voltar
              </Button>
              <Button
                onClick={() => setStep("preview")}
                disabled={isSuggesting}
              >
                Próximo
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")} disabled={isLoading}>
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                disabled={isLoading || !preview || preview.valid === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando…
                  </>
                ) : (
                  "Importar"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTargetsModal;
