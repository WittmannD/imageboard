import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as process from 'node:process';
import { registerAs } from '@nestjs/config';
import yaml from 'js-yaml';

import type { MediaSourceOptions } from '../media-source/media-source.js';
import type { MediaStorageConfig } from '../media-storage/media-storage.js';
import type { NestedTransformOperations } from '../transform/operation/options.js';

export const IMAGE_PROCESSOR_CONFIG = 'image-processor-config';
const YAML_CONFIG_FILENAME =
  process.env['IMAGE_PROCESSOR_CONFIG'] ?? 'image-processor-config.yaml';

export interface ImageProcessorConfig {
  mediaSource: MediaSourceOptions;
  mediaStorage: MediaStorageConfig;
  transform: NestedTransformOperations;
}

export default registerAs(IMAGE_PROCESSOR_CONFIG, () => {
  return yaml.load(
    readFileSync(join(__dirname, YAML_CONFIG_FILENAME), 'utf-8'),
  ) as ImageProcessorConfig;
});
