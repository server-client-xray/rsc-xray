import { writeFile } from 'node:fs/promises';

import type { Model } from '@server-client-xray/schemas';
import { analyzeProject } from '@server-client-xray/analyzer';

export interface ExportModelOptions {
  projectRoot: string;
  distDir?: string;
  appDir?: string;
  outputPath: string;
  pretty?: boolean;
}

export async function exportModel({
  projectRoot,
  distDir,
  appDir,
  outputPath,
  pretty = true,
}: ExportModelOptions): Promise<Model> {
  const model = await analyzeProject({ projectRoot, distDir, appDir });
  const json = JSON.stringify(model, null, pretty ? 2 : 0);
  await writeFile(outputPath, json, 'utf8');
  return model;
}
