import { readFile, writeFile } from 'node:fs/promises';

import type { Model } from '@rsc-xray/schemas';
import { renderHtmlReport } from '@rsc-xray/report-html';

import { ensureValidModel } from '../utils/validateModel';

export interface ReportOptions {
  modelPath: string;
  outputPath: string;
}

function parseModel(json: string, sourcePath: string): Model {
  try {
    return JSON.parse(json) as Model;
  } catch (error) {
    const message = (error as Error).message;
    throw new Error(`Failed to parse model JSON from ${sourcePath}: ${message}`);
  }
}

export async function generateReport({ modelPath, outputPath }: ReportOptions): Promise<void> {
  const raw = await readFile(modelPath, 'utf8');
  const model = parseModel(raw, modelPath);

  ensureValidModel(model);

  const html = renderHtmlReport(model);
  await writeFile(outputPath, html, 'utf8');
}
