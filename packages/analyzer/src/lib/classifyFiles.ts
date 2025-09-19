import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';

import { classifyComponent, type ComponentKind } from './classify';

export interface ClassifiedFile {
  filePath: string;
  kind: ComponentKind;
}

export interface ClassifyFilesOptions {
  projectRoot: string;
  filePaths: string[];
}

export async function classifyFiles({ projectRoot, filePaths }: ClassifyFilesOptions): Promise<ClassifiedFile[]> {
  const results = await Promise.all(
    filePaths.map(async (absPath) => {
      const sourceText = await readFile(absPath, 'utf8');
      const classification = classifyComponent({ fileName: absPath, sourceText });
      return {
        filePath: relative(projectRoot, absPath) || absPath,
        kind: classification.kind
      } satisfies ClassifiedFile;
    })
  );

  return results.sort((a, b) => a.filePath.localeCompare(b.filePath));
}
