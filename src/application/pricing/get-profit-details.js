const DEFAULT_PRICE_API_BASE_URL = "https://api.price.loquieroaca.com";
const DEFAULT_TIMEOUT_MS = 45000;

export async function getProfitDetails(input) {
  const apiKey = process.env.PRICE_API_KEY;

  if (!apiKey) {
    const error = new Error("PRICE_API_KEY no configurada");
    error.status = 500;
    throw error;
  }

  const baseUrl = (process.env.PRICE_API_BASE_URL || DEFAULT_PRICE_API_BASE_URL).replace(/\/$/, "");
  const timeout = AbortSignal.timeout(Number(process.env.PRICE_API_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));
  const response = await fetch(`${baseUrl}/internal/getProfit/details`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": apiKey
    },
    body: JSON.stringify(normalizeInput(input)),
    signal: timeout,
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Price API ${response.status}: ${body.slice(0, 180)}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function normalizeInput(input = {}) {
  const payload = {
    mla: input.mla,
    categoryId: input.categoryId,
    publicationType: input.publicationType,
    sku: input.sku,
    salePrice: Number(input.salePrice)
  };

  if (input.meliContributionPercentage !== undefined && input.meliContributionPercentage !== "") {
    payload.meliContributionPercentage = Number(input.meliContributionPercentage);
  }

  return payload;
}
