import { CpeClient } from "@/src/infrastructure/http/cpe-client";
import { sampleOrders } from "@/src/domain/orders/sample-data";

export async function listOrders({ token, searchParams }) {
  const client = new CpeClient({ token });
  const query = {
    page: searchParams.get("page") || "1",
    limit: searchParams.get("limit") || "12",
    status: searchParams.get("status") || "",
    promotionId: searchParams.get("promotionId") || ""
  };

  try {
    return normalizeOrdersResponse(await client.get("/orders", query), query);
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    return normalizeOrdersResponse({
      data: sampleOrders,
      total: sampleOrders.length,
      page: Number(query.page),
      limit: Number(query.limit),
      totalPages: 1
    }, query);
  }
}

function normalizeOrdersResponse(response, query) {
  const data = response.data || response.items || [];
  const total = response.total ?? response.totalItems ?? data.length;
  const limit = Number(response.limit || query.limit || 12);

  return {
    data,
    total,
    page: Number(response.page || query.page || 1),
    limit,
    totalPages: Number(response.totalPages || Math.max(1, Math.ceil(total / limit)))
  };
}
