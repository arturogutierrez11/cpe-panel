import { CpeClient } from "@/src/infrastructure/http/cpe-client";
import { samplePromotions } from "@/src/domain/promotions/sample-data";

export async function listPromotions({ token, searchParams }) {
  const client = new CpeClient({ token });
  const query = {
    status: searchParams.get("status") || "ACTIVE",
    page: searchParams.get("page") || "1",
    limit: searchParams.get("limit") || "50",
    q: searchParams.get("q") || "",
    itemId: searchParams.get("itemId") || "",
    sku: searchParams.get("sku") || "",
    type: searchParams.get("type") || "",
    categoryId: searchParams.get("categoryId") || "",
    profitable: searchParams.get("profitable") || ""
  };

  try {
    return normalizePromotionsResponse(await client.get("/promotions", query), query);
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    const filtered = samplePromotions.filter((promotion) => {
      if (query.status && query.status !== "ALL" && promotion.status !== query.status) return false;
      const search = `${promotion.itemId} ${promotion.sku} ${promotion.promotionId} ${promotion.name}`.toLowerCase();
      return !query.q || search.includes(query.q.toLowerCase());
    });

    return normalizePromotionsResponse({
      data: filtered,
      total: query.status === "ACTIVE" ? 153415 : filtered.length,
      page: Number(query.page),
      limit: Number(query.limit),
      totalPages: query.status === "ACTIVE" ? 3069 : Math.max(1, Math.ceil(filtered.length / Number(query.limit)))
    }, query);
  }
}

function normalizePromotionsResponse(response, query) {
  const data = response.data || response.items || [];
  const total = response.total ?? response.totalItems ?? data.length;
  const limit = Number(response.limit || query.limit || 50);

  return {
    data,
    total,
    page: Number(response.page || query.page || 1),
    limit,
    totalPages: Number(response.totalPages || Math.max(1, Math.ceil(total / limit)))
  };
}
