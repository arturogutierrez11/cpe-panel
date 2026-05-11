import { CpeClient } from "@/src/infrastructure/http/cpe-client";
import { sampleOrders, sampleOrdersByStatus, sampleOrdersOverview, sampleOrdersTimeseries } from "@/src/domain/orders/sample-data";

const DEFAULT_FROM_DATE = "2026-05-01 00:00:00";
const DEFAULT_MADRE_API_BASE_URL = "https://api.madre.loquieroaca.com";

export async function listOrders({ token, searchParams }) {
  const client = new CpeClient({ baseUrl: getMadreApiBaseUrl() });
  const query = {
    limit: searchParams.get("limit") || "50",
    offset: searchParams.get("offset") || "0",
    status: searchParams.get("status") || "",
    fromDate: searchParams.get("fromDate") || DEFAULT_FROM_DATE,
    toDate: searchParams.get("toDate") || "",
    groupBy: searchParams.get("groupBy") || "day"
  };

  try {
    const [orders, overview, byStatus, paidTimeseries, cancelledTimeseries] = await Promise.all([
      client.get("/api/mercadolibre/orders/aporte-ml", pick(query, ["limit", "offset", "status"])),
      client.get("/api/mercadolibre/orders/analytics/overview", pick(query, ["fromDate", "toDate", "status"])),
      client.get("/api/mercadolibre/orders/analytics/by-status", pick(query, ["fromDate", "toDate"])),
      client.get("/api/mercadolibre/orders/analytics/aporte-ml/timeseries", { ...pick(query, ["fromDate", "toDate", "groupBy"]), status: "paid" }),
      client.get("/api/mercadolibre/orders/analytics/aporte-ml/timeseries", { ...pick(query, ["fromDate", "toDate", "groupBy"]), status: "cancelled" })
    ]);

    return normalizeOrdersResponse({ orders, overview, byStatus, paidTimeseries, cancelledTimeseries }, query);
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    return normalizeOrdersResponse({
      orders: {
        items: sampleOrders,
        total: sampleOrders.length,
        limit: Number(query.limit),
        offset: Number(query.offset),
        count: sampleOrders.length,
        hasNext: false,
        nextOffset: null
      },
      overview: sampleOrdersOverview,
      byStatus: { items: sampleOrdersByStatus },
      paidTimeseries: { items: sampleOrdersTimeseries },
      cancelledTimeseries: { items: sampleOrdersTimeseries.map((item) => ({ ...item, aporteMl: item.aporteMl * 0.42, orders: 1, revenue: item.revenue * 0.38 })) }
    }, query);
  }
}

function getMadreApiBaseUrl() {
  return process.env.MADRE_API_BASE_URL || DEFAULT_MADRE_API_BASE_URL;
}

function pick(source, keys) {
  return keys.reduce((params, key) => {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      params[key] = source[key];
    }
    return params;
  }, {});
}

function normalizeOrdersResponse(response, query) {
  const orders = response.orders || {};
  const data = (orders.items || orders.data || []).map(normalizeOrder);
  const total = orders.total ?? data.length;
  const limit = Number(orders.limit || query.limit || 50);
  const offset = Number(orders.offset || query.offset || 0);

  return {
    data,
    total,
    items: data,
    limit,
    offset,
    count: Number(orders.count ?? data.length),
    hasNext: Boolean(orders.hasNext),
    nextOffset: orders.nextOffset ?? null,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    overview: normalizeOverview(response.overview),
    byStatus: response.byStatus?.items || [],
    timeseries: response.paidTimeseries?.items || [],
    paidTimeseries: response.paidTimeseries?.items || [],
    cancelledTimeseries: response.cancelledTimeseries?.items || []
  };
}

function normalizeOrder(order) {
  return {
    ...order,
    id: order.id || order.nroVenta,
    status: order.estadoOrden || order.status,
    itemId: order.sku,
    grossAmount: order.precioVenta,
    createdAt: order.fechaVenta || order.createdAt
  };
}

function normalizeOverview(overview = {}) {
  return {
    totalOrders: Number(overview.totalOrders || 0),
    totalAporteMl: Number(overview.totalAporteMl || 0),
    avgAporteMl: Number(overview.avgAporteMl || 0),
    totalRevenue: Number(overview.totalRevenue || 0),
    avgTicket: Number(overview.avgTicket || 0)
  };
}
