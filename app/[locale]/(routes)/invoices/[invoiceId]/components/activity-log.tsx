"use client";

interface Activity {
  id: string;
  action: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

interface ActivityLogProps {
  activities: Activity[];
}

const ACTION_LABELS: Record<string, string> = {
  CREATED: "Fatura criada",
  ISSUED: "Fatura emitida",
  SENT: "Fatura enviada por e-mail",
  PAYMENT_ADDED: "Pagamento registrado",
  PAYMENT_DELETED: "Pagamento excluído",
  CANCELLED: "Fatura cancelada",
  DUPLICATED: "Fatura duplicada",
  UPDATED: "Fatura atualizada",
  STATUS_CHANGED: "Status alterado",
};

export function ActivityLog({ activities }: ActivityLogProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">Nenhuma atividade ainda</p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <div key={a.id} className="flex items-start gap-3">
          <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">
              {ACTION_LABELS[a.action] ?? a.action}
            </p>
            <p className="text-muted-foreground text-xs">
              {new Date(a.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
