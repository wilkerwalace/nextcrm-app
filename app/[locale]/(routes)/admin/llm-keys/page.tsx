import { getSystemApiKeys } from "../actions/api-keys";
import { ProviderKeyCard } from "./ProviderKeyCard";
import { getSession } from "@/lib/auth-server";
import Container from "../../components/ui/Container";
import { getTranslations } from "next-intl/server";
import { AlertCircle } from "lucide-react";

export default async function LlmKeysPage() {
  const session = await getSession();
  const t = await getTranslations("AdminPage");

  if (session?.user?.role !== "admin") {
    return (
      <Container title="Chaves de Provedores de IA" description="Gerenciamento de API Keys de LLM">
        <div className="flex w-full h-full items-center justify-center">
          {t("accessNotAllowed")}
        </div>
      </Container>
    );
  }

  const keys = await getSystemApiKeys();

  return (
    <Container
      title="Chaves de Provedores de IA"
      description="Prioridade: ENV → Global do sistema → Perfil do usuário"
    >
      <div className="space-y-6 max-w-2xl">
        {/* Info banner */}
        <div className="flex gap-3 rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            As chaves globais do sistema são usadas quando nenhuma variável ENV está definida. Os usuários podem
            configurar suas próprias chaves nas configurações de perfil.
          </p>
        </div>

        {/* Provider cards */}
        <div className="grid gap-4">
          {keys.map((status) => (
            <ProviderKeyCard key={status.provider} status={status} />
          ))}
        </div>
      </div>
    </Container>
  );
}
