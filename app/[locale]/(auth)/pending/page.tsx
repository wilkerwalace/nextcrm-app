import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import TryAgain from "./components/TryAgain";
import { Users } from "@prisma/client";

const PendingPage = async () => {
  const adminUsers: Users[] = await prismadb.users.findMany({
    where: {
      role: "admin",
      userStatus: "ACTIVE",
    },
  });

  const session = await getSession();

  if (session?.user.userStatus !== "PENDING") {
    return redirect("/");
  }

  return (
    <div className="flex flex-col space-y-5 justify-center items-center max-w-3xl border rounded-md p-10 shadow-md">
      {/*       <pre>
        <code>{JSON.stringify(session, null, 2)}</code>
      </pre> */}
      <div className="flex flex-col">
        <h1 className="text-3xl">
          {process.env.NEXT_PUBLIC_APP_NAME} - sua conta precisa ser autorizada
          pelo Administrador
        </h1>
        <p>
          Olá, bem-vindo ao {process.env.NEXT_PUBLIC_APP_NAME}. Peça a alguém da
          sua organização para aprovar sua conta. Se você for o primeiro
          usuário, entre em contato com o suporte técnico para habilitar a conta.
        </p>
      </div>
      <div className="flex flex-col justify-center ">
        <h2 className="flex justify-center text-xl">Lista de Administradores</h2>
        {adminUsers &&
          adminUsers?.map((user: Users) => (
            <div
              key={user.id}
              className="flex flex-col p-5 m-2 gap-3 border rounded-md"
            >
              <div>
                <p className="font-bold">{user.name}</p>
                <p>{user.id}</p>
                <p>
                  <Link href={`mailto:  ${user.email}`}>{user.email}</Link>
                </p>
              </div>
            </div>
          ))}
      </div>
      <div className="flex flex-col md:flex-row space-x-2 justify-center items-center">
        <Button asChild>
          <Link href="/sign-in">Entrar com outra conta</Link>
        </Button>
        <p>ou</p>
        <TryAgain />
      </div>
    </div>
  );
};

export default PendingPage;
