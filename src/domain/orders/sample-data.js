export const sampleOrders = [
  {
    id: "ORD-918233",
    nroVenta: "2000016360218308",
    sku: "B0CZFTMZSK",
    estadoOrden: "paid",
    fechaVenta: "2026-05-10T12:13:49.000Z",
    aporteMl: 4818.09,
    precioVenta: 560789.06,
    nombreProducto: "Producto demo con aporte ML",
    ciudad: "CABA",
    provincia: "Buenos Aires",
    createdAt: "2026-05-10T12:14:00.000Z",
    updatedAt: "2026-05-10T12:15:00.000Z"
  },
  {
    id: "ORD-918231",
    nroVenta: "2000016360219594",
    sku: "B0CYJXXZG6",
    estadoOrden: "cancelled",
    fechaVenta: "2026-05-10T12:16:34.000Z",
    aporteMl: 17219.96,
    precioVenta: 517009.03,
    nombreProducto: "Producto cancelado demo",
    ciudad: "Rosario",
    provincia: "Santa Fe",
    createdAt: "2026-05-10T12:17:00.000Z",
    updatedAt: "2026-05-10T12:18:00.000Z"
  }
];

export const sampleOrdersOverview = {
  totalOrders: 2,
  totalAporteMl: 22038.05,
  avgAporteMl: 11019.03,
  totalRevenue: 1077798.09,
  avgTicket: 538899.05
};

export const sampleOrdersByStatus = [
  { status: "paid", orders: 1, aporteMl: 4818.09, revenue: 560789.06 },
  { status: "cancelled", orders: 1, aporteMl: 17219.96, revenue: 517009.03 }
];

export const sampleOrdersTimeseries = [
  { date: "2026-05-10", aporteMl: 22038.05, orders: 2, revenue: 1077798.09 }
];
