import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { BasicView } from "./components/BasicView";
import { getTarget } from "@/actions/crm/get-target";

const TargetViewPage = async (props: any) => {
  const params = await props.params;
  const { targetId } = params;
  const target: any = await getTarget(targetId);

  if (!target) return <div>Alvo não encontrado</div>;

  return (
    <Container
      title={`Detalhes do alvo: ${target?.first_name || ""} ${target?.last_name}`}
      description="Tudo o que você precisa saber sobre este alvo"
    >
      <div className="space-y-5">
        <BasicView data={target} />
      </div>
    </Container>
  );
};

export default TargetViewPage;
