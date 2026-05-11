import { REFRESH_COOKIE, SESSION_COOKIE } from "@/src/infrastructure/auth/cookies";

const DEFAULT_AUTH_BASE_URL = "https://auth.api.loquieroaca.com";

export function getAuthBaseUrl() {
  return (process.env.AUTH_API_BASE_URL || DEFAULT_AUTH_BASE_URL).replace(/\/$/, "");
}

export async function refreshSession(request) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${getAuthBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (!data.accessToken) {
    return null;
  }

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken || refreshToken,
    user: data.user || null
  };
}

export function setSessionCookies(response, session) {
  response.cookies.set(SESSION_COOKIE, session.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  if (session.refreshToken) {
    response.cookies.set(REFRESH_COOKIE, session.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  }

  return response;
}
