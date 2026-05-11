export const samplePromotions = [
  {
    _id: "69f761f9b2e4b9bab8a9c32d",
    promotionId: "P-MLA17339002",
    itemId: "MLA1542903365",
    name: "Hace crecer tus ventas Abril",
    type: "SMART",
    startDate: "2026-04-05T03:50:00.000Z",
    finishDate: "2026-05-06T02:50:00.000Z",
    sku: "B0CZFTMZSK",
    categoryId: "MLA120353",
    listingTypeId: "gold_special",
    prices: { originalPrice: 602999, suggestedPrice: 560789.06 },
    economics: {
      cost: 517666.54,
      profit: 63310.93,
      profitability: 10.9,
      margin: 12.23,
      profitable: true,
      shouldPause: false
    },
    metadata: {
      syncedAt: "2026-05-03T14:55:53.810Z",
      activatedAt: "2026-05-03T16:13:11.662Z",
      updatedBy: "scheduler",
      sourceProcess: "cron.deactivate",
      statusReason: "Promotion revalidated and kept active"
    },
    offerId: "OFFER-MLA1542903365-10942549129",
    terms: {
      resignation: {
        total: 7,
        mercadolibre: { percentage: 3.6, amount: 21707.964 },
        seller: { percentage: 3.4, amount: 20501.966 }
      }
    },
    status: "ACTIVE",
    auditTrail: [
      { process: "cron.sync", status: "SYNCED", executedAt: "2026-05-03T14:55:53.810Z", reason: "Promotion synchronized" },
      { process: "cron.activate", status: "ACTIVE", executedAt: "2026-05-03T16:13:11.662Z", reason: "Profitability rules passed" },
      { process: "cron.deactivate", status: "ACTIVE", executedAt: "2026-05-03T21:22:36.742Z", reason: "Promotion revalidated and kept active" }
    ],
    updatedAt: "2026-05-03T21:22:36.742Z"
  },
  {
    _id: "69f10174b2e4b9bab8a915ca",
    promotionId: "P-MLA17339002",
    itemId: "MLA1540427391",
    name: "Hace crecer tus ventas Abril",
    type: "SMART",
    startDate: "2026-04-05T03:50:00.000Z",
    finishDate: "2026-05-06T02:50:00.000Z",
    sku: "B0CYJXXZG6",
    categoryId: "MLA30040",
    listingTypeId: "gold_special",
    prices: { originalPrice: 599999, suggestedPrice: 517009.03 },
    economics: {
      cost: 485142.81,
      profit: 45825.46,
      profitability: 8.63,
      margin: 9.45,
      profitable: true,
      shouldPause: false
    },
    metadata: {
      syncedAt: "2026-05-03T14:57:46.929Z",
      activatedAt: "2026-05-03T16:09:36.262Z",
      deactivatedAt: "2026-05-03T21:03:21.203Z",
      updatedBy: "scheduler",
      sourceProcess: "cron.deactivate",
      reason: "Current sale price no longer satisfies profitability rules",
      statusReason: "Promotion pause automatically"
    },
    offerId: "OFFER-MLA1540427391-10942543029",
    terms: {
      resignation: {
        total: 13.9,
        mercadolibre: { percentage: 2.7, amount: 16199.973 },
        seller: { percentage: 11.2, amount: 67199.888 }
      }
    },
    status: "DELETED",
    auditTrail: [
      { process: "manual-sync", status: "SYNCED", executedAt: "2026-04-28T18:50:28.032Z", reason: "Promotion synchronized" },
      { process: "cron.activate", status: "ACTIVE", executedAt: "2026-05-03T16:09:36.262Z", reason: "Profitability rules passed" },
      { process: "cron.deactivate", status: "DELETED", executedAt: "2026-05-03T21:03:21.203Z", reason: "Current sale price no longer satisfies profitability rules" }
    ],
    updatedAt: "2026-05-03T21:03:21.203Z"
  }
];
