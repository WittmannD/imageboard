import { join } from 'node:path';
import type { Provider } from '@nestjs/common';

import { YamlTemplate } from '@hdotu1/yaml-template';

import type { OperationNestedConfigs } from '../transform/operation/operation-map.js';

const __dirname = import.meta.dirname;
export const IMAGE_TRANSFORM_CONFIG_LOADER = 'IMAGE_TRANSFORM_CONFIG_LOADER';
export const DEFAULT_IMAGE_TRANSFORM_CONFIG = 'image-transform.config.yaml';

export interface ImageTransformConfig {
  transform: OperationNestedConfigs;
}

export class ImageTransformConfigLoader {
  private readonly publicConfigDir = '../../config';
  private readonly configs = new Map<
    string,
    YamlTemplate<ImageTransformConfig>
  >();

  async get(key: string): Promise<YamlTemplate<ImageTransformConfig>> {
    const cached = this.configs.get(key);

    if (cached) {
      return cached;
    }

    const yamlConfigTemplate = await YamlTemplate.create<ImageTransformConfig>(
      join(__dirname, this.publicConfigDir, key),
    );
    this.configs.set(key, yamlConfigTemplate);
    return yamlConfigTemplate;
  }
}

export const ImageTransformConfigLoaderProvider: Provider = {
  provide: IMAGE_TRANSFORM_CONFIG_LOADER,
  useClass: ImageTransformConfigLoader,
};
