import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface VercelInviteUserEmailProps {
  username: string;
  invitedByUsername: string;
  userLanguage: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export const InviteUserEmail = ({
  username,
  invitedByUsername,
  userLanguage,
}: VercelInviteUserEmailProps) => {
  const previewText =
    userLanguage === "en"
      ? `Você foi convidado por ${invitedByUsername} para o aplicativo AMZC CRM`
      : `Byl jste pozván uživatelem ${invitedByUsername} do aplikace AMZC CRM`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-slate-300 rounded-md my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-black text-2xl font-normal text-center p-0 my-[30px] mx-0">
              {userLanguage === "en"
                ? "  Você foi convidado para colaborar em algo especial"
                : "Byl(a) jste pozván(a) ke spolupráci na něčem úžasném"}
            </Heading>
            <Text className="text-black text-sm leading-[24px]">
              {userLanguage === "en"
                ? `Olá ${username},`
                : `Dobrý den ${username},`}
            </Text>
            <Text className="text-black text-sm leading-[24px]">
              <strong>{invitedByUsername}</strong>
              {/*   (
            <Link
                href={`mailto:${invitedByEmail}`}
                className="text-blue-600 no-underline"
              >
                {invitedByEmail}
              </Link>   )*/}
              {userLanguage === "en"
                ? ` convidou você para o`
                : ` Vás pozval ke spolupráci na`}
            </Text>
            <Text>
              <strong>{process.env.NEXT_PUBLIC_APP_NAME}</strong> aplicativo:
              <strong>{process.env.NEXT_PUBLIC_APP_URL}</strong>.
            </Text>
            <Text className="text-black text-sm leading-[24px]">
              {userLanguage === "en"
                ? `Para aceitar este convite, clique no botão abaixo e entre com seu endereço de e-mail.`
                : `Pro přijetí této pozvánky klikněte na tlačítko níže a přihlaste se pomocí své e-mailové adresy.`}
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-slate-800 rounded-md text-white  py-3 px-4 text-xs font-semibold no-underline text-center"
                href={process.env.NEXT_PUBLIC_APP_URL}
              >
                {userLanguage === "en" ? "Entrar para a equipe" : "Připojit se"}
              </Button>
            </Section>
            <Text className="text-black text-sm leading-[24px]">
              {userLanguage === "en"
                ? `
              ou copie e cole este link no seu navegador:`
                : `     nebo zkopírujte a vložte tento odkaz do svého prohlížeče:`}{" "}
              <Link
                href={process.env.NEXT_PUBLIC_APP_URL}
                className="text-blue-600 no-underline"
              >
                {process.env.NEXT_PUBLIC_APP_URL}
              </Link>
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-slate-500 text-muted-foreground text-xs leading-[24px]">
              {userLanguage === "en"
                ? `Este convite era destinado a `
                : `Toto pozvání bylo určeno pro `}
              <span className="text-black">{username}. </span>
              {userLanguage === "en"
                ? "Se você não esperava este convite, pode ignorar este e-mail. Se estiver preocupado com a segurança da sua conta, responda a este e-mail para entrar em contato conosco."
                : "Pokud jste toto pozvání neočekávali, můžete tento e-mail ignorovat. Pokud se obáváte o bezpečnost svého účtu, odpovězte na tento e-mail, abyste se s námi spojili."}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InviteUserEmail;
