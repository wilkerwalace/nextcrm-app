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
  taskFromUser: string;
  username: string;
  userLanguage: string;
  taskData: any;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export const NewTaskFromCRMEmail = ({
  taskFromUser,
  username,
  userLanguage,
  taskData,
}: VercelInviteUserEmailProps) => {
  const previewText =
    userLanguage === "en"
      ? `Nova tarefa do aplicativo ${process.env.NEXT_PUBLIC_APP_NAME}`
      : `Nový úkolu z aplikace  ${process.env.NEXT_PUBLIC_APP_NAME}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-black text-2xl font-normal text-center p-0 my-[30px] mx-0">
              {userLanguage === "en"
                ? "Há uma nova tarefa do módulo CRM"
                : "Nový úkol z modulu CRM"}
            </Heading>
            <Text className="text-black text-sm leading-[24px]">
              {userLanguage === "en"
                ? `Olá ${username},`
                : `Dobrý den ${username},`}
            </Text>
            <Text className="text-black text-sm leading-[24px]">
              <strong>{taskFromUser}</strong>
              {userLanguage === "en"
                ? ` criou uma tarefa e atribuiu ela a você. `
                : ` vytvořil úkol a přiřadil vás k němu. `}
            </Text>
            <Text className="text-black text-sm leading-[24px]">
              {userLanguage === "en"
                ? `
              Você pode encontrar os detalhes aqui: `
                : `
              Podrobnosti najdete zde: `}

              <strong>{`${process.env.NEXT_PUBLIC_APP_URL}/projects/tasks/viewtask/${taskData.id}`}</strong>
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-slate-800 rounded-md text-white  py-3 px-4 text-xs font-semibold no-underline text-center"
                href={`${process.env.NEXT_PUBLIC_APP_URL}/projects/tasks/viewtask/${taskData.id}`}
              >
                {userLanguage === "en" ? "Ver detalhes da tarefa" : "Zobrazit úkol"}
              </Button>
            </Section>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-xs leading-[24px]">
              {userLanguage === "en"
                ? `Esta mensagem era destinada a - `
                : `Tato zpráva  byla určeno pro - `}
              <span className="text-black">{username}</span>.
              <span className="text-black"></span>.
              {userLanguage === "en"
                ? "Se você não esperava esta mensagem, pode ignorar este e-mail. Se estiver preocupado com a segurança da sua conta, responda a este e-mail para entrar em contato conosco."
                : "Pokud jste tuto zprávu neočekávali, můžete tento e-mail ignorovat. Pokud se obáváte o bezpečnost svého účtu, odpovězte na tento e-mail, abyste se s námi spojili."}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default NewTaskFromCRMEmail;
