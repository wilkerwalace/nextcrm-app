import { getLead } from "@/actions/crm/get-lead";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import React from "react";
import { BasicView } from "./components/BasicView";
import { FindSimilarButton } from "@/components/crm/find-similar-button";
import DocumentsView from "../../components/DocumentsView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryTab } from "./components/HistoryTab";
import { ActivitiesSection } from "./components/ActivitiesSection";
import LeadFunnelPanel from "./components/LeadFunnelPanel";

interface LeadDetailPageProps {
  params: Promise<{
    leadId: string;
  }>;
}

const LeadDetailPage = async (props: LeadDetailPageProps) => {
  const params = await props.params;
  const { leadId } = params;
  const lead: any = await getLead(leadId);

  if (!lead) return <div>Lead não encontrado</div>;

  return (
    <Container
      title={`Lead: ${lead?.firstName} ${lead?.lastName}`}
      description={"Tudo o que você precisa saber sobre o potencial de vendas"}
    >
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="funnel">Funil / BOT</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="space-y-5">
            <BasicView data={lead} />
            <ActivitiesSection leadId={lead.id} />
            <FindSimilarButton entityType="lead" recordId={leadId} />
            {/*         <DocumentsView data={lead?.documents} /> */}
          </div>
        </TabsContent>
        <TabsContent value="funnel">
          <LeadFunnelPanel lead={lead} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab leadId={leadId} />
        </TabsContent>
      </Tabs>
    </Container>
  );
};

export default LeadDetailPage;
