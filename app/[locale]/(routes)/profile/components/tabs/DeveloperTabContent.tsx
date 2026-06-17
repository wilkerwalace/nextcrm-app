// app/[locale]/(routes)/profile/components/tabs/DeveloperTabContent.tsx
import { getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { ApiTokens } from "../ApiTokens";
import { SkillMdCopyButton } from "../SkillMdCopyButton";

type Props = { userId: string };

export async function DeveloperTabContent({ userId: _userId }: Props) {
  const t = await getTranslations("ProfilePage");
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-card-foreground">
          {t("cards.apiTokens")}
        </h3>
        <ApiTokens />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-2 text-sm font-semibold text-card-foreground">
          Claude Code Skill
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Baixe o arquivo SKILL.md e coloque-o no seu diretório{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            .claude/skills/
          </code>{" "}
          . Ele documenta todas as 127 ferramentas MCP para que o Claude Code possa
          interagir com os dados do seu CRM.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/SKILL.md"
            download="SKILL.md"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Baixar SKILL.md
          </a>
          <SkillMdCopyButton />
        </div>
      </div>
    </div>
  );
}
