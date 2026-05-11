export function calculatePromotionMetrics(items = [], total = 0) {
  const profitable = items.filter((item) => item.economics?.profitable).length;
  const shouldPause = items.filter((item) => item.economics?.shouldPause).length;
  const avgProfitability = average(items.map((item) => item.economics?.profitability));
  const avgMargin = average(items.map((item) => item.economics?.margin));
  const sellerResignation = sum(items.map((item) => item.terms?.resignation?.seller?.amount));
  const meliResignation = sum(items.map((item) => item.terms?.resignation?.mercadolibre?.amount));

  return {
    total,
    profitable,
    shouldPause,
    avgProfitability,
    avgMargin,
    sellerResignation,
    meliResignation
  };
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return 0;
  return clean.reduce((acc, value) => acc + value, 0) / clean.length;
}

function sum(values) {
  return values.filter((value) => Number.isFinite(value)).reduce((acc, value) => acc + value, 0);
}
