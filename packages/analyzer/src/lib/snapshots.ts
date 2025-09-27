import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { FlightSample } from '@rsc-xray/schemas';

export const HYDRATION_SNAPSHOT_PATH = ['.scx', 'hydration.json'] as const;
export const FLIGHT_SNAPSHOT_PATH = ['.scx', 'flight.json'] as const;

export async function readHydrationSnapshot(projectRoot: string): Promise<Record<string, number>> {
  const snapshotPath = join(projectRoot, ...HYDRATION_SNAPSHOT_PATH);
  try {
    const raw = await readFile(snapshotPath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const durations: Record<string, number> = {};
    for (const [nodeId, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof nodeId !== 'string' || nodeId.length === 0) {
        continue;
      }
      const numeric = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(numeric) && numeric >= 0) {
        durations[nodeId] = numeric;
      }
    }
    return durations;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read hydration snapshot at ${snapshotPath}: ${reason}`);
  }
}

export async function readFlightSnapshot(projectRoot: string): Promise<FlightSample[]> {
  const snapshotPath = join(projectRoot, ...FLIGHT_SNAPSHOT_PATH);
  try {
    const raw = await readFile(snapshotPath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return [];
    }

    const samplesInput = (parsed as { samples?: unknown }).samples;
    if (!Array.isArray(samplesInput)) {
      return [];
    }

    const samples: FlightSample[] = [];
    for (const entry of samplesInput) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }
      const { route, ts, chunkIndex, label } = entry as Record<string, unknown>;
      if (typeof route !== 'string' || route.trim().length === 0) {
        continue;
      }
      const tsNumber = typeof ts === 'number' ? ts : Number(ts);
      const chunkNumber = typeof chunkIndex === 'number' ? chunkIndex : Number(chunkIndex);
      if (!Number.isFinite(tsNumber) || !Number.isFinite(chunkNumber)) {
        continue;
      }
      const chunk = Math.max(0, Math.trunc(chunkNumber));
      const sample: FlightSample = {
        route,
        ts: tsNumber,
        chunkIndex: chunk,
      };
      if (typeof label === 'string' && label.trim().length > 0) {
        sample.label = label;
      }
      samples.push(sample);
    }
    return samples;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read Flight snapshot at ${snapshotPath}: ${reason}`);
  }
}
