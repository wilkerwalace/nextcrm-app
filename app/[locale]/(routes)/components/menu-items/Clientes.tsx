import { Building2 } from "lucide-react";
import { NavItem } from "../nav-main";

export const getClientesMenuItem = (): NavItem => {
  return {
    title: "Clientes",
    icon: Building2,
    url: "/clientes",
  };
};

export default getClientesMenuItem;
