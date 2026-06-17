import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components";

type ScheduledReportProps = { reportName: string; dateRange: string };

export default function ScheduledReport({ reportName = "Report", dateRange = "" }: ScheduledReportProps) {
  return (
    <Html>
      <Head />
      <Preview>Seu relatório agendado: {reportName}</Preview>
      <Body style={{ fontFamily: "sans-serif", padding: "20px" }}>
        <Container>
          <Heading as="h2">{reportName}</Heading>
          {dateRange && <Text style={{ color: "#666" }}>Período: {dateRange}</Text>}
          <Hr />
          <Text>Seu relatório agendado está anexado a este e-mail.</Text>
          <Text style={{ color: "#999", fontSize: "12px" }}>Este é um relatório automático do AMZC CRM.</Text>
        </Container>
      </Body>
    </Html>
  );
}
