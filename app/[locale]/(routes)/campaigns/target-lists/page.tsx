import { Suspense } from "react";

import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";
import Container from "../../components/ui/Container";
import TargetListsView from "./components/TargetListsView";
import { getTargetLists } from "@/actions/crm/get-target-lists";

const TargetListsPage = async () => {
  const targetLists = await getTargetLists();
  return (
    <Container
      title="Listas de Alvos"
      description="Gerencie suas listas de alvos para campanhas e prospecção"
    >
      <Suspense fallback={<CrmTableSkeleton />}>
        <TargetListsView data={targetLists} />
      </Suspense>
    </Container>
  );
};

export default TargetListsPage;
