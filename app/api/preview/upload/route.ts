import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import AdmZip from "adm-zip";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

const PREVIEW_DIR = process.env.PREVIEW_DIR || "/opt/previews";

function safeSlug(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
}

/** Recebe um .zip do site e extrai para /opt/previews/{slug} (volume compartilhado com o Caddy). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const form = await req.formData();
  const leadId = String(form.get("leadId") || "");
  let slug = safeSlug(String(form.get("slug") || ""));
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
  if (!slug) return NextResponse.json({ error: "Slug ausente (defina o slug da prévia primeiro)" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  let zip: AdmZip;
  try {
    zip = new AdmZip(buf);
  } catch {
    return NextResponse.json({ error: "ZIP inválido" }, { status: 400 });
  }

  const dest = path.join(PREVIEW_DIR, slug);
  // proteção contra path traversal no destino
  if (!dest.startsWith(PREVIEW_DIR + path.sep)) {
    return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
  }

  try {
    await fs.rm(dest, { recursive: true, force: true });
    await fs.mkdir(dest, { recursive: true });
    // extrai entradas, ignorando path traversal dentro do zip
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue;
      const target = path.join(dest, entry.entryName);
      if (!target.startsWith(dest + path.sep)) continue; // zip-slip guard
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, entry.getData());
    }
    // se o zip tinha uma pasta raiz única e não há index.html na raiz, "achata"
    const hasIndex = await fs
      .access(path.join(dest, "index.html"))
      .then(() => true)
      .catch(() => false);
    if (!hasIndex) {
      const items = await fs.readdir(dest, { withFileTypes: true });
      const dirs = items.filter((i) => i.isDirectory());
      if (items.length === 1 && dirs.length === 1) {
        const inner = path.join(dest, dirs[0].name);
        const innerHas = await fs
          .access(path.join(inner, "index.html"))
          .then(() => true)
          .catch(() => false);
        if (innerHas) {
          for (const f of await fs.readdir(inner)) {
            await fs.rename(path.join(inner, f), path.join(dest, f));
          }
          await fs.rm(inner, { recursive: true, force: true });
        }
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Falha ao extrair (volume montado?)" }, { status: 500 });
  }

  const previewUrl = `https://${slug}.${process.env.PREVIEW_BASE_DOMAIN || "preview.amzc.tech"}`;
  if (leadId) {
    try {
      await prismadb.crm_Leads.update({ where: { id: leadId }, data: { preview_slug: slug, preview_url: previewUrl } });
    } catch {}
  }
  return NextResponse.json({ ok: true, preview_url: previewUrl });
}
