import { NextResponse, type NextRequest } from "next/server";
import { getViewer, nextStepFor } from "@/lib/auth";

/** One place that decides where a signed-in user goes: profile → consent → welcome → their org. */
export async function GET(request: NextRequest) {
  const viewer = await getViewer();
  const to = viewer ? nextStepFor(viewer, request.nextUrl.searchParams.get("next")) : "/auth/sign-in";
  return NextResponse.redirect(new URL(to, request.nextUrl.origin));
}
