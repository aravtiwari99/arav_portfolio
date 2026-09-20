import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !engineId) return NextResponse.json({ error: "Google Search is not configured." }, { status: 503 });

  const body = await request.json().catch(() => null) as { query?: unknown } | null;
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query || query.length > 300) return NextResponse.json({ error: "Invalid search query." }, { status: 400 });

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", engineId);
  url.searchParams.set("q", query);
  url.searchParams.set("num", "5");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return NextResponse.json({ error: "Google Search request failed." }, { status: 502 });

  const result = await response.json() as {
    items?: Array<{ title?: string; snippet?: string; link?: string }>;
  };
  return NextResponse.json({
    results: (result.items || []).map((item) => ({
      title: item.title || "",
      snippet: item.snippet || "",
      link: item.link || "",
    })),
  });
}
