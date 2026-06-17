import { InvoicesTabs } from "./_components/InvoicesTabs";

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Faturas</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as configurações de faturas, séries de numeração e alíquotas de imposto.
        </p>
      </div>
      <InvoicesTabs />
      {children}
    </div>
  );
}
