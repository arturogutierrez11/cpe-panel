import { NextResponse } from "next/server";
import { getAuthBaseUrl } from "@/src/infrastructure/auth/auth-api";
import { REFRESH_COOKIE, SESSION_COOKIE } from "@/src/infrastructure/auth/cookies";

export async function POST(request) {
  const accessToken = request.cookies.get(SESSION_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (accessToken && refreshToken) {
    await fetch(`${getAuthBaseUrl()}/auth/logout`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ refreshToken })
    }).catch(() => null);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
  response.cookies.set(REFRESH_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
