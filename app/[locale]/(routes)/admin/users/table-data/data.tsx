import { StopIcon, PauseIcon, PlayIcon } from "@radix-ui/react-icons";

export const statuses = [
  {
    value: "ACTIVE",
    label: "Ativo",
    icon: PlayIcon,
  },
  {
    value: "INACTIVE",
    label: "Inativo",
    icon: StopIcon,
  },
  {
    value: "PENDING",
    label: "Pendente",
    icon: PauseIcon,
  },
];
export const roles = [
  {
    value: "admin",
    label: "Administrador",
    icon: PlayIcon,
  },
  {
    value: "manager",
    label: "Gerente",
    icon: PauseIcon,
  },
  {
    value: "user",
    label: "Usuário",
    icon: StopIcon,
  },
];
