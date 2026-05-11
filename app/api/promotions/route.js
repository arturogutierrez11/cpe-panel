import { NextResponse } from "next/server";
import { listPromotions } from "@/src/application/promotions/list-promotions";
import { refreshSession, setSessionCookies } from "@/src/infrastructure/auth/auth-api";
import { SESSION_COOKIE } from "@/src/infrastructure/auth/cookies";

export async function GET(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const data = await listPromotions({ token, searchParams: request.nextUrl.searchParams });
    return NextResponse.json(data);
  } catch (error) {
    if (error.status === 401) {
      const refreshed = await refreshSession(request);

      if (!refreshed) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      try {
        const data = await listPromotions({
          token: refreshed.accessToken,
          searchParams: request.nextUrl.searchParams
        });

        return setSessionCookies(NextResponse.json(data), refreshed);
      } catch (retryError) {
        return NextResponse.json({ message: retryError.message }, { status: retryError.status || 502 });
      }
    }

    return NextResponse.json({ message: error.message }, { status: 502 });
  }
}
