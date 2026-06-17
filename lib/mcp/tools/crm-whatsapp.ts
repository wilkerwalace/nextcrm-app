import { z } from "zod";
import { prismadb } from "@/lib/prisma";
import { listResponse, itemResponse, paginationSchema } from "../helpers";
import { sendWhatsAppCore } from "@/actions/whatsapp/send-message";
import { onlyDigits } from "@/lib/integrations/evolution";

export const crmWhatsappTools = [
  {
    name: "whatsapp_send_message",
    description:
      "Send a WhatsApp text message to a phone number (digits with country code), optionally linked to a leadId or contactId. Logs the message and an activity in the CRM.",
    schema: z.object({
      number: z.string().min(5),
      text: z.string().min(1),
      leadId: z.string().uuid().optional(),
      contactId: z.string().uuid().optional(),
      name: z.string().optional(),
    }),
    async handler(
      args: { number: string; text: string; leadId?: string; contactId?: string; name?: string },
      userId: string
    ) {
      const res = await sendWhatsAppCore(userId, args);
      if ((res as any).error) throw new Error((res as any).error);
      return itemResponse((res as any).data);
    },
  },
  {
    name: "whatsapp_list_messages",
    description:
      "List recent WhatsApp messages for a conversation, identified by phone number, leadId or contactId (most recent first).",
    schema: z.object({
      number: z.string().optional(),
      leadId: z.string().uuid().optional(),
      contactId: z.string().uuid().optional(),
      ...paginationSchema,
    }),
    async handler(
      args: { number?: string; leadId?: string; contactId?: string; limit: number; offset: number },
      _userId: string
    ) {
      let conv = null as { id: string } | null;
      if (args.number)
        conv = await prismadb.whatsApp_Conversation.findUnique({
          where: { remoteNumber: onlyDigits(args.number) },
          select: { id: true },
        });
      else if (args.leadId)
        conv = await prismadb.whatsApp_Conversation.findFirst({ where: { leadId: args.leadId }, select: { id: true } });
      else if (args.contactId)
        conv = await prismadb.whatsApp_Conversation.findFirst({ where: { contactId: args.contactId }, select: { id: true } });
      if (!conv) return listResponse([], 0, args.offset);
      const [data, total] = await Promise.all([
        prismadb.whatsApp_Message.findMany({
          where: { conversationId: conv.id },
          orderBy: { timestamp: "desc" },
          take: args.limit,
          skip: args.offset,
        }),
        prismadb.whatsApp_Message.count({ where: { conversationId: conv.id } }),
      ]);
      return listResponse(data, total, args.offset);
    },
  },
  {
    name: "find_or_create_lead_by_phone",
    description:
      "Find an existing lead by phone (or the WhatsApp conversation's linked lead); if none exists, create a new lead with source 'WhatsApp'. Returns { leadId, created }.",
    schema: z.object({ phone: z.string().min(5), name: z.string().optional() }),
    async handler(args: { phone: string; name?: string }, userId: string) {
      const number = onlyDigits(args.phone);
      const conv = await prismadb.whatsApp_Conversation.findUnique({ where: { remoteNumber: number } });
      if (conv?.leadId) return itemResponse({ leadId: conv.leadId, created: false });

      const existing = await prismadb.crm_Leads.findFirst({
        where: { phone: number, deletedAt: null },
        select: { id: true },
      });
      if (existing) {
        if (conv) await prismadb.whatsApp_Conversation.update({ where: { id: conv.id }, data: { leadId: existing.id } });
        return itemResponse({ leadId: existing.id, created: false });
      }

      const source = await prismadb.crm_Lead_Sources.upsert({
        where: { name: "WhatsApp" },
        update: {},
        create: { name: "WhatsApp" },
        select: { id: true },
      });
      const lead = await prismadb.crm_Leads.create({
        data: {
          v: 1,
          lastName: args.name || number,
          phone: number,
          lead_source_id: source.id,
          assigned_to: userId,
          createdBy: userId,
          updatedBy: userId,
        },
        select: { id: true },
      });
      if (conv) await prismadb.whatsApp_Conversation.update({ where: { id: conv.id }, data: { leadId: lead.id } });
      return itemResponse({ leadId: lead.id, created: true });
    },
  },
];
