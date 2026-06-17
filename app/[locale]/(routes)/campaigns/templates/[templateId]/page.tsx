import { getTemplate } from "@/actions/campaigns/templates/get-template";
import TemplateEditorForm from "../new/components/TemplateEditorForm";

type Props = {
  params: Promise<{ templateId: string }>;
};

export default async function EditTemplatePage({ params }: Props) {
  const { templateId } = await params;
  const template = await getTemplate(templateId);

  if (!template) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <p className="text-muted-foreground">Modelo não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Editar Modelo</h1>
        <p className="text-muted-foreground">
          Atualize o modelo de e-mail da sua campanha
        </p>
      </div>
      <TemplateEditorForm
        templateId={template.id}
        initialData={{
          name: template.name,
          description: template.description,
          subject_default: template.subject_default,
          content_html: template.content_html,
          content_json: template.content_json as object | null,
        }}
      />
    </div>
  );
}
