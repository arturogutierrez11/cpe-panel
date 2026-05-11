const DEFAULT_BASE_URL = "http://cpe.loquieroaca.com";
const DEFAULT_TIMEOUT_MS = 45000;

export class CpeClient {
  constructor({ baseUrl = process.env.CPE_API_BASE_URL || DEFAULT_BASE_URL, token } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
  }

  async get(path, params = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    const timeout = AbortSignal.timeout(Number(process.env.CPE_API_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
      },
      signal: timeout,
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      const body = await response.text();
      const error = new Error(`CPE API ${response.status}: ${body.slice(0, 180)}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  async post(path, body = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    const timeout = AbortSignal.timeout(Number(process.env.CPE_API_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
      },
      body: JSON.stringify(body),
      signal: timeout,
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      const responseBody = await response.text();
      const error = new Error(`CPE API ${response.status}: ${responseBody.slice(0, 180)}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  }
}
