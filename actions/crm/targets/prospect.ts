"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  geocodeCity,
  searchBusinesses,
  scoreProspect,
  CATEGORY_GROUPS,
} from "@/lib/integrations/overpass";

export type ProspectInput = {
  country: string;
  city: string;
  groups?: string[]; // chaves de CATEGORY_GROUPS; vazio = todas
  listName?: string; // se informado, cria/usa uma lista e adiciona os novos targets
  max?: number; // limite de negócios a importar
};

export const runProspecting = async (input: ProspectInput) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  const userId = (session.user as any).id as string;

  const country = (input.country || "").trim();
  const city = (input.city || "").trim();
  if (!country || !city) return { error: "Informe país e cidade" };
  const max = Math.min(Math.max(input.max ?? 200, 1), 500);
  const groups = (input.groups || []).filter((g) => CATEGORY_GROUPS[g]);

  try {
    const box = await geocodeCity(city, country);
    const businesses = (await searchBusinesses(box, groups, max)).slice(0, max);

    // dedupe contra targets já existentes do usuário na mesma cidade
    const existing = await prismadb.crm_Targets.findMany({
      where: { created_by: userId, deletedAt: null, city: { equals: city, mode: "insensitive" } },
      select: { company: true, last_name: true },
    });
    const seen = new Set(
      existing.map((t) => (t.company || t.last_name || "").trim().toLowerCase()).filter(Boolean)
    );

    const createdIds: string[] = [];
    let skipped = 0;
    for (const b of businesses) {
      const key = b.name.toLowerCase();
      if (seen.has(key)) { skipped++; continue; }
      seen.add(key);
      const { score, tier, reasons } = scoreProspect(b);
      const groupLabel = CATEGORY_GROUPS[b.categoryGroup]?.label || b.categoryGroup;
      try {
        const t = await prismadb.crm_Targets.create({
          data: {
            last_name: b.name,
            company: b.name,
            company_website: b.website || undefined,
            company_phone: b.phone || undefined,
            mobile_phone: b.phone || undefined,
            company_email: b.email || undefined,
            email: b.email || undefined,
            social_instagram: b.instagram || undefined,
            social_facebook: b.facebook || undefined,
            city,
            country,
            industry: groupLabel,
            description: [b.street, b.category].filter(Boolean).join(" · ") || undefined,
            prospect_score: score,
            status: true,
            tags: ["Prospecção", "OSM", b.categoryGroup, `oportunidade:${tier}`],
            notes: [
              `Triagem (${score}/100 · ${tier}): ${reasons.join("; ")}`,
              `Categoria OSM: ${b.category}`,
              `Fonte: OpenStreetMap ${b.osmId}`,
            ],
            created_by: userId,
          },
          select: { id: true },
        });
        createdIds.push(t.id);
      } catch {
        skipped++;
      }
    }

    // lista opcional
    let listId: string | null = null;
    if (input.listName && createdIds.length) {
      const name = input.listName.trim();
      let list = await prismadb.crm_TargetLists.findFirst({
        where: { name, created_by: userId, deletedAt: null },
        select: { id: true },
      });
      if (!list) {
        list = await prismadb.crm_TargetLists.create({
          data: { name, description: `Prospecção: ${city}, ${country}`, created_by: userId },
          select: { id: true },
        });
      }
      listId = list.id;
      await prismadb.targetsToTargetLists.createMany({
        data: createdIds.map((tid) => ({ target_id: tid, target_list_id: listId! })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/[locale]/(routes)/campaigns/targets", "page");
    return {
      data: {
        found: businesses.length,
        created: createdIds.length,
        skipped,
        listId,
        listName: input.listName || null,
        location: box.displayName,
      },
    };
  } catch (e: any) {
    return { error: e?.message || "Falha na prospecção" };
  }
};
