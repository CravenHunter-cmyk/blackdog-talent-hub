import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

  if (hasOpenAIKey) {
    return NextResponse.json({ ok: true, hasOpenAIKey: true });
  }

  return NextResponse.json(
    {
      ok: false,
      hasOpenAIKey: false,
      error: 'OPENAI_API_KEY is missing',
    },
    { status: 500 },
  );
}
