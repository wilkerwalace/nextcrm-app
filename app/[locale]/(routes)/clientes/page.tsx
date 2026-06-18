import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { listTenants } from "@/actions/clientes/tenants";
import ClientesClient from "./components/ClientesClient";

const ClientesPage = async () => {
  const tenants: any[] = (await listTenants()) as any[];
  return (
    <Container
      title="Clientes"
      description="Seus clientes que recebem agentes de IA (WhatsApp/widget) e agenda"
    >
      <ClientesClient tenants={tenants} />
    </Container>
  );
};

export default ClientesPage;
