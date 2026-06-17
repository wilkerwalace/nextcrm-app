import React from "react";
import Container from "../../components/ui/Container";
import { getSaleStages } from "@/actions/crm/get-sales-stage";
import CRMKanban from "./_components/CRMKanban";
import { getOpportunities } from "@/actions/crm/get-opportunities";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { serializeDecimalsList } from "@/lib/serialize-decimals";

const CrmDashboardPage = async () => {
  const salesStages = await getSaleStages();
  const opportunities = serializeDecimalsList(await getOpportunities());
  const crmData = await getAllCrmData();

  return (
    <Container
      title="Painel do CRM"
      description="Em desenvolvimento. Após a conclusão deste componente, haverá uma atualização otimista dos dados."
    >
      <div className="w-full h-full  overflow-hidden">
        <CRMKanban
          salesStages={salesStages}
          opportunities={opportunities}
          crmData={crmData}
        />
      </div>

      {/*     <CRMKanbanServer
        salesStages={salesStages}
        opportunities={opportunities}
      /> */}
    </Container>
  );
};

export default CrmDashboardPage;
