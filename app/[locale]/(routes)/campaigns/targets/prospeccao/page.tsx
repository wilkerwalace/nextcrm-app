import Container from "../../../components/ui/Container";
import ProspectingForm from "./components/ProspectingForm";

const ProspectingPage = () => {
  return (
    <Container
      title="Prospecção"
      description="Encontre negócios por cidade (via OpenStreetMap), faça a triagem por presença digital e importe como Alvos"
    >
      <ProspectingForm />
    </Container>
  );
};

export default ProspectingPage;
