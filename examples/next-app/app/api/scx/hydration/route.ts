import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { NextResponse } from 'next/server';

const SNAPSHOT_PATH = join(process.cwd(), '.scx', 'hydration.json');

interface HydrationPayload {
  durations?: Record<string, unknown>;
}

function normalizeDurations(input: HydrationPayload['durations']): Record<string, number> {
  if (!input || typeof input !== 'object') {
    return {};
  }

  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof key !== 'string' || key.length === 0) {
      continue;
    }
    const numeric = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(numeric) && numeric >= 0) {
      result[key] = numeric;
    }
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as HydrationPayload;
    const durations = normalizeDurations(payload.durations);

    if (Object.keys(durations).length === 0) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    await mkdir(dirname(SNAPSHOT_PATH), { recursive: true });
    await writeFile(SNAPSHOT_PATH, JSON.stringify(durations, null, 2), 'utf8');

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[scx] Failed to persist hydration metrics', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
