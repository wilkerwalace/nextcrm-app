import {
  CircleIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons";
import { PenLineIcon, Rotate3D } from "lucide-react";

export const statuses = [
  {
    value: "NOTSTARTED",
    label: "Não iniciado",
    icon: QuestionMarkCircledIcon,
  },
  {
    value: "INPROGRESS",
    label: "Em andamento",
    icon: Rotate3D,
  },
  {
    value: "SIGNED",
    label: "Assinado",
    icon: PenLineIcon,
  },
];
