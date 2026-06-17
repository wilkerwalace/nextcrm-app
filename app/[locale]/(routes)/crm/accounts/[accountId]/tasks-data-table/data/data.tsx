import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons";

export const labels = [
  {
    value: "bug",
    label: "Bug",
  },
  {
    value: "feature",
    label: "Feature",
  },
  {
    value: "documentation",
    label: "Documentation",
  },
];

export const statuses = [
  {
    value: "ACTIVE",
    label: "Ativo",
    icon: QuestionMarkCircledIcon,
  },
  {
    value: "PENDING",
    label: "Pendente",
    icon: CircleIcon,
  },
  {
    value: "COMPLETE",
    label: "Concluída",
    icon: StopwatchIcon,
  },
];

export const priorities = [
  {
    label: "Baixa",
    value: "low",
    icon: ArrowDownIcon,
  },
  {
    label: "Normal",
    value: "normal",
    icon: ArrowRightIcon,
  },
  {
    label: "Média",
    value: "medium",
    icon: ArrowRightIcon,
  },
  {
    label: "Alta",
    value: "high",
    icon: ArrowUpIcon,
  },
  {
    label: "Crítica",
    value: "critical",
    icon: ArrowUpIcon,
  },
];
