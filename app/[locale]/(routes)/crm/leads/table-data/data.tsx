import {
  CircleIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons";

export const statuses = [
  {
    value: "NEW",
    label: "Novo",
    icon: QuestionMarkCircledIcon,
  },
  {
    value: "IN_PROGRESS",
    label: "Em andamento",
    icon: StopwatchIcon,
  },
  {
    value: "COMPLETED",
    label: "Concluído",
    icon: StopwatchIcon,
  },
];
