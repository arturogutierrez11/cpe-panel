export const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0
});

export const compactNumberFormatter = new Intl.NumberFormat("es-AR", {
  notation: "compact",
  maximumFractionDigits: 1
});

export const percentFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2
});

export function formatCurrency(value) {
  if (!Number.isFinite(value)) return "-";
  return currencyFormatter.format(value);
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("es-AR").format(value);
}

export function formatCompact(value) {
  if (!Number.isFinite(value)) return "-";
  return compactNumberFormatter.format(value);
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) return "-";
  return `${percentFormatter.format(value)}%`;
}

export function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}
