import { samplePromotionCatalog } from "@/src/domain/catalog/sample-data";
import { CpeClient } from "@/src/infrastructure/http/cpe-client";

export async function listPromotionCatalog({ token, searchParams }) {
  const client = new CpeClient({ token });
  const query = {
    page: searchParams.get("page") || "1",
    limit: searchParams.get("limit") || "100",
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "",
    type: searchParams.get("type") || ""
  };

  try {
    const endpoint = process.env.CPE_PROMOTION_CATALOG_PATH || "/promotions/catalogs";
    return normalizeCatalogResponse(await client.get(endpoint, query), query);
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    const filtered = samplePromotionCatalog.filter((promotion) => {
      const text = `${promotion.name} ${promotion.promotionId} ${promotion.type} ${promotion.status}`.toLowerCase();
      if (query.status && promotion.status !== query.status) return false;
      if (query.type && promotion.type !== query.type) return false;
      return !query.q || text.includes(query.q.toLowerCase());
    });

    return normalizeCatalogResponse({
      data: filtered,
      total: filtered.length,
      page: Number(query.page),
      limit: Number(query.limit),
      totalPages: Math.max(1, Math.ceil(filtered.length / Number(query.limit)))
    }, query);
  }
}

function normalizeCatalogResponse(response, query) {
  const data = response.data || response.items || response.promotions || [];
  const total = response.total ?? response.totalItems ?? data.length;
  const limit = Number(response.limit || query.limit || 50);

  return {
    data: data.map(normalizeMongoDates),
    total,
    page: Number(response.page || query.page || 1),
    limit,
    totalPages: Number(response.totalPages || Math.max(1, Math.ceil(total / limit)))
  };
}

function normalizeMongoDates(item) {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => {
    if (value && typeof value === "object" && "$date" in value) return [key, value.$date];
    if (value && typeof value === "object" && "$oid" in value) return [key, value.$oid];
    return [key, value];
  }));
}
