import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import React from "react";
import Container from "../../../components/ui/Container";
import { getAccountsTasks } from "@/actions/crm/account/get-tasks";
import { getUserCRMTasks } from "@/actions/crm/tasks/get-user-tasks";

const UserCRMDashboard = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const task = await getUserCRMTasks(session.user.id);

  return (
    <div>
      <Container
        title={`${session.user.name} | Painel do CRM (em andamento) `}
        description="Seus dados de vendas em um só lugar"
      >
        <div className="grid grid-cols-2 w-full ">
          <div className="">Visão geral de ligações</div>
          <div className="">
            <h1>Tarefas em Empresas</h1>
            <pre>{JSON.stringify(task, null, 2)}</pre>
          </div>
          <div className="">Visão geral de reuniões</div>
          <div className="">
            <h1></h1>
          </div>
          <div className="">Visão geral de leads</div>
          <div className="">
            <h1></h1>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default UserCRMDashboard;
