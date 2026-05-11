import { NextResponse } from "next/server";
import { runPromotionAction } from "@/src/application/actions/run-promotion-action";
import { refreshSession, setSessionCookies } from "@/src/infrastructure/auth/auth-api";
import { SESSION_COOKIE } from "@/src/infrastructure/auth/cookies";

export async function POST(request) {
  const body = await request.json();

  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const data = await runPromotionAction({ token, action: body.action, payload: body.payload || {} });
    return NextResponse.json(data);
  } catch (error) {
    if (error.status === 401) {
      const refreshed = await refreshSession(request);

      if (!refreshed) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const data = await runPromotionAction({
        token: refreshed.accessToken,
        action: body.action,
        payload: body.payload || {}
      });

      return setSessionCookies(NextResponse.json(data), refreshed);
    }

    return NextResponse.json({ message: error.message }, { status: error.status || 502 });
  }
}
