import { rm } from 'node:fs/promises';

import type { Model } from '@server-client-xray/schemas';

import { exportModel, type ExportModelOptions } from './exportModel';
import { ensureValidModel } from '../utils/validateModel';

export type AnalyzeOptions = ExportModelOptions;

export async function analyze(options: AnalyzeOptions): Promise<Model> {
  const model = await exportModel(options);

  try {
    ensureValidModel(model);
  } catch (error) {
    await rm(options.outputPath, { force: true });
    throw error;
  }

  return model;
}
