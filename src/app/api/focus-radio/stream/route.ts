import { NextRequest, NextResponse } from "next/server";
import { validateFocusRadioStreamUrl } from "@/focus-radio/stream-proxy";

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  const validation = validateFocusRadioStreamUrl(rawUrl);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const upstream = await fetch(validation.url.toString(), {
      headers: { Accept: "audio/*,*/*;q=0.8" },
      cache: "no-store",
      redirect: "follow",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Stream request failed (${upstream.status})` },
        { status: upstream.status },
      );
    }

    const contentType = upstream.headers.get("Content-Type") ?? "audio/mpeg";

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Stream request failed" }, { status: 502 });
  }
}
