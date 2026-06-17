import TemplateEditorForm from "./components/TemplateEditorForm";

export default function NewTemplatePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Novo Modelo</h1>
        <p className="text-muted-foreground">
          Crie um modelo de e-mail para campanha
        </p>
      </div>
      <TemplateEditorForm />
    </div>
  );
}
