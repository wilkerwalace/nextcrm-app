import {
  CircleIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons";

export const statuses = [
  {
    value: "ACTIVE",
    label: "Ativo",
    icon: QuestionMarkCircledIcon,
  },
  {
    value: "INACTIVE",
    label: "Inativo",
    icon: CircleIcon,
  },
  {
    value: "PENDING",
    label: "Pendente",
    icon: CircleIcon,
  },
  {
    value: "CLOSED",
    label: "Fechado",
    icon: StopwatchIcon,
  },
];
