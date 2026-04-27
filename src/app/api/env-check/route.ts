import { NextResponse } from 'next/server';

export async function GET() {
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
