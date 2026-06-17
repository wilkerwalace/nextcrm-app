import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { BasicView } from "./components/BasicView";
import DesignIdeaButton from "./components/DesignIdeaButton";
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
        <DesignIdeaButton
          targetId={target.id}
          existing={
            ((target.notes as string[]) || [])
              .find((n: string) => n.startsWith("💡 Ideia de design"))
              ?.replace(/^💡 Ideia de design[^\n]*\n/, "") || null
          }
        />
      </div>
    </Container>
  );
};

export default TargetViewPage;
