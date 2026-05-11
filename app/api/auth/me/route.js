import { NextResponse } from "next/server";
import { getAuthBaseUrl, refreshSession, setSessionCookies } from "@/src/infrastructure/auth/auth-api";
import { SESSION_COOKIE } from "@/src/infrastructure/auth/cookies";

export async function GET(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const response = await fetchMe(token);

  if (response.ok) {
    return NextResponse.json(await response.json());
  }

  if (response.status !== 401) {
    return NextResponse.json({ message: "No se pudo validar la sesion" }, { status: response.status });
  }

  const refreshed = await refreshSession(request);

  if (!refreshed) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const retry = await fetchMe(refreshed.accessToken);

  if (!retry.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return setSessionCookies(NextResponse.json(await retry.json()), refreshed);
}

function fetchMe(token) {
  if (!token) {
    return Promise.resolve(new Response(null, { status: 401 }));
  }

  return fetch(`${getAuthBaseUrl()}/auth/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });
}
