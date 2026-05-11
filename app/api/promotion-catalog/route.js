import { NextResponse } from "next/server";
import { listPromotionCatalog } from "@/src/application/catalog/list-promotion-catalog";
import { refreshSession, setSessionCookies } from "@/src/infrastructure/auth/auth-api";
import { SESSION_COOKIE } from "@/src/infrastructure/auth/cookies";

export async function GET(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const data = await listPromotionCatalog({ token, searchParams: request.nextUrl.searchParams });
    return NextResponse.json(data);
  } catch (error) {
    if (error.status === 401) {
      const refreshed = await refreshSession(request);

      if (!refreshed) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const data = await listPromotionCatalog({
        token: refreshed.accessToken,
        searchParams: request.nextUrl.searchParams
      });

      return setSessionCookies(NextResponse.json(data), refreshed);
    }

    return NextResponse.json({ message: error.message }, { status: error.status || 502 });
  }
}
