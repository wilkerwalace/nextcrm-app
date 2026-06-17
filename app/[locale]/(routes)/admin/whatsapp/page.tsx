import Container from "../../components/ui/Container";
import WhatsAppConnect from "./components/WhatsAppConnect";

const WhatsAppAdminPage = () => {
  return (
    <Container
      title="WhatsApp"
      description="Conecte o número do WhatsApp (via EvolutionGO) e acompanhe o status da conexão"
    >
      <WhatsAppConnect />
    </Container>
  );
};

export default WhatsAppAdminPage;
