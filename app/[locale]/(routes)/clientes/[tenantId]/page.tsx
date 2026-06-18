import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getTenant } from "@/actions/clientes/tenants";
import TenantDetail from "../components/TenantDetail";

const TenantPage = async (props: any) => {
  const params = await props.params;
  const t: any = await getTenant(params.tenantId);
  if (!t) return <div>Cliente não encontrado</div>;
  return (
    <Container title={`Cliente: ${t.name}`} description="Agente de IA, agenda e canais">
      <TenantDetail tenant={JSON.parse(JSON.stringify(t))} />
    </Container>
  );
};

export default TenantPage;
