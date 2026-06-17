import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { crm_Opportunities } from "@prisma/client";
import {
  CalendarDays,
  ClipboardList,
  CoinsIcon,
  Combine,
  Landmark,
  List,
  SquareStack,
  Text,
  User,
} from "lucide-react";
import moment from "moment";
import { Clapperboard } from "lucide-react";
import { prismadb } from "@/lib/prisma";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { OpportunityDetailActions } from "./OpportunityDetailActions";
import { formatCurrency, convertAmount, getExchangeRates, getDefaultCurrency } from "@/lib/currency";
import { Decimal } from "@prisma/client/runtime/client";
import { cookies } from "next/headers";
import { serializeDecimals } from "@/lib/serialize-decimals";

interface OppsViewProps {
  data: {
    assigned_sales_stage: { name: string };
    assigned_to_user: { name: string };
    assigned_account: { name: string };
    assigned_type: { name: string };
  } & crm_Opportunities;
}

export async function BasicView({ data }: OppsViewProps) {
  //console.log(data, "data");
  const users = await prismadb.users.findMany();
  const crmData = await getAllCrmData();
  const { saleTypes, saleStages, campaigns, currencies } = crmData;
  const cookieStore = await cookies();
  const defaultCurrency = await getDefaultCurrency();
  const displayCurrency = cookieStore.get("display_currency")?.value || defaultCurrency;
  const rates = await getExchangeRates();
  if (!data) return <div>Oportunidade não encontrada</div>;

  const fromCurrency = data.currency || "EUR";
  const budgetAmount = new Decimal(data.budget?.toString() ?? "0");
  const displayBudget = displayCurrency !== fromCurrency
    ? convertAmount(budgetAmount, fromCurrency, displayCurrency, rates)
    : null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex w-full justify-between">
          <div>
            <CardTitle>{data.name}</CardTitle>
            <CardDescription>ID:{data.id}</CardDescription>
          </div>
          <OpportunityDetailActions
            opportunity={serializeDecimals(data)}
            saleTypes={saleTypes}
            saleStages={saleStages}
            campaigns={campaigns}
            currencies={currencies.map((c: { code: string; name: string; symbol: string }) => ({ code: c.code, name: c.name, symbol: c.symbol }))}
          />
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-1">
        <div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <CoinsIcon className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                Valor da oportunidade
              </p>
              <p className="text-sm text-muted-foreground">
                {displayBudget
                  ? formatCurrency(displayBudget, displayCurrency)
                  : formatCurrency(budgetAmount, fromCurrency)}
              </p>
            </div>
          </div>

          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <SquareStack className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Estágio de venda</p>
              <p className="text-sm text-muted-foreground">
                {data.assigned_sales_stage?.name
                  ? data.assigned_sales_stage?.name
                  : "Não atribuído"}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <Combine className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Próximo passo</p>
              <p className="text-sm text-muted-foreground">{data.next_step}</p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <ClipboardList className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Descrição</p>
              <p className="text-sm text-muted-foreground">
                {data.description}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <User className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Atribuído a</p>
              <p className="text-sm text-muted-foreground">
                {data.assigned_to_user.name}
              </p>
            </div>
          </div>
        </div>
        <div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <Landmark className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Nome da empresa</p>
              <p className="text-sm text-muted-foreground">
                {data.assigned_account?.name
                  ? data.assigned_account?.name
                  : "Não atribuído"}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <CalendarDays className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                Data prevista de fechamento
              </p>
              <p className="text-sm text-muted-foreground">
                {moment(data.close_date).format("MMM DD YYYY")}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <CalendarDays className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Data de criação</p>
              <p className="text-sm text-muted-foreground">
                {moment(data.createdAt).format("MMM DD YYYY")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Criado por</p>
              <p className="text-sm text-muted-foreground">
                {users.find((user) => user.id === data.createdBy)?.name}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <CalendarDays className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Última atualização</p>
              <p className="text-sm text-muted-foreground">
                {moment(data.updatedAt).format("MMM DD YYYY")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Última atualização por</p>
              <p className="text-sm text-muted-foreground">
                {users.find((user) => user.id === data.updatedBy)?.name}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <List className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Tipo</p>
              <p className="text-sm text-muted-foreground">
                {data.assigned_type?.name ? data.assigned_type?.name : "N/A"}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <Landmark className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Origem do lead</p>
              <p className="text-sm text-muted-foreground">
                Será adicionado no futuro
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <Clapperboard className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Campanha</p>
              <p className="text-sm text-muted-foreground">
                Será adicionado no futuro
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
