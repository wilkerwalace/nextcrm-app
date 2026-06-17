import { getConfigValues } from "./_actions/crm-settings";
import { CrmSettingsTabs } from "./_components/CrmSettingsTabs";

export default async function CrmSettingsPage() {
  const [
    industries,
    contactTypes,
    leadSources,
    leadStatuses,
    leadTypes,
    opportunityTypes,
    salesStages,
  ] = await Promise.all([
    getConfigValues("industry"),
    getConfigValues("contactType"),
    getConfigValues("leadSource"),
    getConfigValues("leadStatus"),
    getConfigValues("leadType"),
    getConfigValues("opportunityType"),
    getConfigValues("salesStage"),
  ]);

  const tabs = [
    { key: "industry" as const,        label: "Setores",            values: industries },
    { key: "contactType" as const,     label: "Tipos de Contato",   values: contactTypes },
    { key: "leadSource" as const,      label: "Origens de Lead",    values: leadSources },
    { key: "leadStatus" as const,      label: "Status de Lead",     values: leadStatuses },
    { key: "leadType" as const,        label: "Tipos de Lead",      values: leadTypes },
    { key: "opportunityType" as const, label: "Tipos de Oportunidade", values: opportunityTypes },
    { key: "salesStage" as const,      label: "Estágios de Venda",  values: salesStages },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do CRM</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie os valores padrão usados nos módulos do CRM.
        </p>
      </div>
      <CrmSettingsTabs tabs={tabs} />
    </div>
  );
}
