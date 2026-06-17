import {
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons";

export const labels = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "documentation", label: "Documentation" },
];

export const documentSystemTypes = [
  { value: "RECEIPT", label: "Recibo" },
  { value: "CONTRACT", label: "Contrato" },
  { value: "OFFER", label: "Proposta" },
  { value: "OTHER", label: "Outro" },
];

export const processingStatuses = [
  { value: "PENDING", label: "Pendente", icon: CircleIcon },
  { value: "PROCESSING", label: "Processando", icon: StopwatchIcon },
  { value: "READY", label: "Pronto", icon: CheckCircledIcon },
  { value: "FAILED", label: "Falhou", icon: CrossCircledIcon },
];

// Keep legacy exports for any remaining references
export const statuses = processingStatuses;
export const priorities = [
  { label: "Baixa", value: "low" },
  { label: "Normal", value: "normal" },
  { label: "Alta", value: "high" },
  { label: "Crítica", value: "critical" },
];
