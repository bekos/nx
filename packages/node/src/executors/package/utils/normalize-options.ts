import { ExecutorContext, logger } from '@nrwl/devkit';

import * as glob from 'glob';
import { basename, dirname, join, relative } from 'path';

import {
  FileInputOutput,
  NodePackageBuilderOptions,
  NormalizedBuilderOptions,
} from './models';

export default function normalizeOptions(
  options: NodePackageBuilderOptions,
  context: ExecutorContext,
  libRoot: string
): NormalizedBuilderOptions {
  const outDir = options.outputPath;
  const files: FileInputOutput[] = [];

  const globbedFiles = (pattern: string, input = '', ignore: string[] = []) => {
    return glob.sync(pattern, {
      cwd: input,
      nodir: true,
      ignore,
    });
  };

  options.assets.forEach((asset) => {
    const _files: FileInputOutput[] =
      typeof asset === 'string'
        ? globbedFiles(asset, context.root).map((globbedFile) => ({
            input: join(context.root, globbedFile),
            output: join(context.root, outDir, basename(globbedFile)),
          }))
        : globbedFiles(
            asset.glob,
            join(context.root, asset.input),
            asset.ignore
          ).map((globbedFile) => ({
            input: join(context.root, asset.input, globbedFile),
            output: join(context.root, outDir, asset.output, globbedFile),
          }));

    if (_files.length === 0) {
      const pattern = JSON.stringify(asset, null, 2);
      logger.warn(`No assets matching the pattern ${pattern} were found.`);
    } else {
      files.push(..._files);
    }
  });

  const rootDir = libRoot || '';
  const mainFileDir = dirname(options.main);

  const relativeMainFileOutput = relative(rootDir, mainFileDir);

  if (options.buildableProjectDepsInPackageJsonType == undefined) {
    options.buildableProjectDepsInPackageJsonType = 'dependencies';
  }

  return {
    ...options,
    files,
    relativeMainFileOutput,
    normalizedOutputPath: join(context.root, options.outputPath),
  };
}
