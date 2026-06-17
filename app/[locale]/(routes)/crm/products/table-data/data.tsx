import {
  BoxIcon,
  WrenchIcon,
  FileEditIcon,
  CheckCircle2Icon,
  ArchiveIcon,
  CalendarIcon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  TimerIcon,
} from "lucide-react";

export const productTypes = [
  {
    value: "PRODUCT",
    label: "Produto",
    icon: BoxIcon,
  },
  {
    value: "SERVICE",
    label: "Serviço",
    icon: WrenchIcon,
  },
];

export const productStatuses = [
  {
    value: "DRAFT",
    label: "Rascunho",
    icon: FileEditIcon,
  },
  {
    value: "ACTIVE",
    label: "Ativo",
    icon: CheckCircle2Icon,
  },
  {
    value: "ARCHIVED",
    label: "Arquivado",
    icon: ArchiveIcon,
  },
];

export const billingPeriods = [
  {
    value: "MONTHLY",
    label: "Mensal",
    icon: CalendarIcon,
  },
  {
    value: "QUARTERLY",
    label: "Trimestral",
    icon: CalendarDaysIcon,
  },
  {
    value: "ANNUALLY",
    label: "Anual",
    icon: CalendarRangeIcon,
  },
  {
    value: "ONE_TIME",
    label: "Único",
    icon: TimerIcon,
  },
];
