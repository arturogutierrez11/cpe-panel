import { NextResponse } from "next/server";
import { refreshSession, setSessionCookies } from "@/src/infrastructure/auth/auth-api";

export async function POST(request) {
  const refreshed = await refreshSession(request);

  if (!refreshed) {
    return NextResponse.json({ message: "Invalid refresh token" }, { status: 401 });
  }

  return setSessionCookies(NextResponse.json({ ok: true, user: refreshed.user }), refreshed);
}
