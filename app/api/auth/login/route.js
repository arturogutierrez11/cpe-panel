import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getAuthBaseUrl, setSessionCookies } from "@/src/infrastructure/auth/auth-api";

export async function POST(request) {
  const payload = await request.json();
  const directToken = payload.token?.trim();
  const authEndpoint = `${getAuthBaseUrl()}/auth/login`;

  let token = directToken;
  let refreshToken = payload.refreshToken?.trim();
  let user = null;

  if (!token && authEndpoint) {
    const response = await fetch(authEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: payload.email || payload.username, password: payload.password })
    });

    if (!response.ok) {
      return NextResponse.json({ message: "Credenciales invalidas" }, { status: 401 });
    }

    const data = await response.json();
    token = data.token || data.accessToken || data.jwt;
    refreshToken = data.refreshToken || refreshToken;
    user = data.user || null;
  }

  if (!token && (payload.email || payload.username) === process.env.AUTH_USER && payload.password === process.env.AUTH_PASSWORD) {
    token = await createLocalJwt(payload.email || payload.username);
  }

  if (!token) {
    return NextResponse.json({ message: "Ingresa email/password o un JWT directo" }, { status: 401 });
  }

  return setSessionCookies(NextResponse.json({ ok: true, user }), {
    accessToken: token,
    refreshToken
  });
}

async function createLocalJwt(subject) {
  const secret = process.env.JWT_SECRET || "change-me";
  return new SignJWT({ role: "operator" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(new TextEncoder().encode(secret));
}
