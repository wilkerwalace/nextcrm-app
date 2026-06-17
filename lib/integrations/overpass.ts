/**
 * Prospecção via OpenStreetMap (Nominatim geocode + Overpass POIs).
 * Sem credencial. Boa prática OSM: User-Agent identificável e uso moderado.
 */

const UA =
  process.env.OSM_USER_AGENT ||
  "AMZC-CRM-Prospecting/1.0 (walace.wilker@amzc.tech)";
const NOMINATIM =
  process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org/search";
const OVERPASS =
  process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter";

export type ProspectBusiness = {
  osmId: string;
  name: string;
  category: string; // valor da tag (ex.: restaurant, hairdresser)
  categoryGroup: string; // grupo amigável (ex.: restaurantes)
  website: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  street: string | null;
  city: string | null;
  country: string | null;
};

// Grupos de categoria -> filtros de tag Overpass
export const CATEGORY_GROUPS: Record<
  string,
  { label: string; filters: string[] }
> = {
  comercio: { label: "Comércio / Lojas", filters: ['node["shop"]', 'way["shop"]'] },
  restaurantes: {
    label: "Restaurantes / Cafés / Bares",
    filters: [
      'node["amenity"~"^(restaurant|cafe|bar|fast_food|pub|ice_cream)$"]',
      'way["amenity"~"^(restaurant|cafe|bar|fast_food|pub|ice_cream)$"]',
    ],
  },
  servicos: {
    label: "Serviços / Escritórios",
    filters: ['node["office"]', 'way["office"]', 'node["craft"]', 'way["craft"]'],
  },
  saude: {
    label: "Saúde",
    filters: [
      'node["amenity"~"^(clinic|dentist|doctors|pharmacy|veterinary)$"]',
      'way["amenity"~"^(clinic|dentist|doctors|pharmacy|veterinary)$"]',
      'node["healthcare"]',
      'way["healthcare"]',
    ],
  },
  beleza: {
    label: "Beleza / Estética",
    filters: [
      'node["shop"~"^(hairdresser|beauty|cosmetics|massage)$"]',
      'way["shop"~"^(hairdresser|beauty|cosmetics|massage)$"]',
    ],
  },
  hospedagem: {
    label: "Hospedagem / Turismo",
    filters: [
      'node["tourism"~"^(hotel|guest_house|hostel|apartment|motel)$"]',
      'way["tourism"~"^(hotel|guest_house|hostel|apartment|motel)$"]',
    ],
  },
};

export type GeoBox = { south: number; west: number; north: number; east: number; displayName: string };

async function osmFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": UA, Accept: "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`OSM HTTP ${res.status} (${url.split("?")[0]})`);
  return res;
}

/** Geocodifica "cidade, país" -> bounding box. */
export async function geocodeCity(city: string, country: string): Promise<GeoBox> {
  const params = new URLSearchParams({
    city,
    country,
    format: "json",
    limit: "1",
    "accept-language": "pt-BR",
  });
  const res = await osmFetch(`${NOMINATIM}?${params.toString()}`);
  const data = (await res.json()) as Array<{ boundingbox: string[]; display_name: string }>;
  if (!data?.length) throw new Error(`Cidade não encontrada no OSM: ${city}, ${country}`);
  const bb = data[0].boundingbox.map(Number); // [S, N, W, E]
  return { south: bb[0], north: bb[1], west: bb[2], east: bb[3], displayName: data[0].display_name };
}

function pickGroupAndCat(tags: Record<string, string>): { group: string; cat: string } {
  if (tags.shop) {
    if (/^(hairdresser|beauty|cosmetics|massage)$/.test(tags.shop)) return { group: "beleza", cat: tags.shop };
    return { group: "comercio", cat: tags.shop };
  }
  if (tags.amenity && /^(restaurant|cafe|bar|fast_food|pub|ice_cream)$/.test(tags.amenity))
    return { group: "restaurantes", cat: tags.amenity };
  if (tags.amenity && /^(clinic|dentist|doctors|pharmacy|veterinary)$/.test(tags.amenity))
    return { group: "saude", cat: tags.amenity };
  if (tags.healthcare) return { group: "saude", cat: tags.healthcare };
  if (tags.tourism) return { group: "hospedagem", cat: tags.tourism };
  if (tags.office) return { group: "servicos", cat: `office:${tags.office}` };
  if (tags.craft) return { group: "servicos", cat: `craft:${tags.craft}` };
  return { group: "outros", cat: tags.shop || tags.amenity || "negócio" };
}

function socialFrom(tags: Record<string, string>, key: string): string | null {
  return tags[`contact:${key}`] || tags[key] || null;
}

/** Busca negócios numa bbox para os grupos de categoria informados. */
export async function searchBusinesses(
  box: GeoBox,
  groups: string[],
  limit = 300
): Promise<ProspectBusiness[]> {
  const sel = (groups.length ? groups : Object.keys(CATEGORY_GROUPS))
    .flatMap((g) => CATEGORY_GROUPS[g]?.filters || [])
    .map((f) => `${f}(${box.south},${box.west},${box.north},${box.east});`)
    .join("");
  const query = `[out:json][timeout:60];(${sel});out tags center ${limit};`;
  const res = await osmFetch(OVERPASS, {
    method: "POST",
    body: new URLSearchParams({ data: query }).toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  const data = (await res.json()) as { elements: Array<{ type: string; id: number; tags?: Record<string, string> }> };
  const out: ProspectBusiness[] = [];
  const seen = new Set<string>();
  for (const el of data.elements || []) {
    const t = el.tags || {};
    const name = t.name?.trim();
    if (!name) continue;
    const dedupeKey = name.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const { group, cat } = pickGroupAndCat(t);
    const street = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ") || null;
    out.push({
      osmId: `${el.type}/${el.id}`,
      name,
      category: cat,
      categoryGroup: group,
      website: socialFrom(t, "website") || t.url || null,
      phone: socialFrom(t, "phone") || socialFrom(t, "mobile") || null,
      email: socialFrom(t, "email") || null,
      instagram: socialFrom(t, "instagram") || null,
      facebook: socialFrom(t, "facebook") || null,
      street,
      city: t["addr:city"] || null,
      country: t["addr:country"] || null,
    });
  }
  return out;
}

/** Triagem por presença digital: score 0-100 (maior = melhor oportunidade p/ web/design). */
export function scoreProspect(b: ProspectBusiness): { score: number; tier: string; reasons: string[] } {
  let score = 15; // baseline: negócio local costuma se beneficiar de site
  const reasons: string[] = [];
  if (!b.website) {
    score += 50;
    reasons.push("Sem site");
  } else {
    reasons.push("Já tem site");
  }
  if (!b.instagram && !b.facebook) {
    score += 25;
    reasons.push("Sem redes sociais");
  }
  if (b.phone) {
    score += 10;
    reasons.push("Telefone disponível (contato facilitado)");
  } else {
    reasons.push("Sem telefone no OSM");
  }
  score = Math.max(0, Math.min(100, score));
  const tier = score >= 70 ? "alta" : score >= 40 ? "média" : "baixa";
  return { score, tier, reasons };
}
