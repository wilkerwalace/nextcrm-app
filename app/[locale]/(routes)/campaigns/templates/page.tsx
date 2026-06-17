import { Suspense } from "react";
import { getTemplates } from "@/actions/campaigns/templates/get-templates";
import Container from "../../components/ui/Container";
import TemplatesView from "./components/TemplatesView";
import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";

export default async function TemplatesPage() {
  const templates = await getTemplates();
  return (
    <Container title="Modelos de Campanha" description="Modelos de e-mail reutilizáveis">
      <Suspense fallback={<CrmTableSkeleton />}>
        <TemplatesView data={templates} />
      </Suspense>
    </Container>
  );
}
