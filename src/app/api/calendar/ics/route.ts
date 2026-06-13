import { NextRequest, NextResponse } from "next/server";
import { describeIcsFeedFetchError, validateIcsFeedUrl } from "@/calendar/ics-feed-url";

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  const validation = validateIcsFeedUrl(rawUrl);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const feedUrl = validation.url.toString();

  try {
    const response = await fetch(feedUrl, {
      headers: { Accept: "text/calendar" },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const hint = describeIcsFeedFetchError(response.status, feedUrl);
      return NextResponse.json(
        {
          error: `Calendar feed request failed (${response.status})`,
          ...(hint ? { hint } : {}),
        },
        { status: response.status },
      );
    }

    const text = await response.text();
    return new NextResponse(text, {
      headers: { "Content-Type": "text/calendar; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "Calendar feed request failed" }, { status: 502 });
  }
}
