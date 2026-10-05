import path from 'node:path';
import { Inject, Injectable } from '@nestjs/common';

import type { StorageDriver } from '@hdotu1/media-storage/drivers';
import { YamlTemplate } from '@hdotu1/yaml-template';

import { MEDIA_STORAGE } from '../providers/storage/transform-storage.provider.js';
import type { OperationNestedConfigs } from './operation/operation-map.js';

export interface ImageTransformConfig {
  transform: OperationNestedConfigs;
}

@Injectable()
export class TransformConfigService {
  private readonly schemaPath = path.resolve(
    import.meta.dirname,
    '../schema/image-transform-config.schema.json',
  );
  private readonly cache = new Map<
    string,
    YamlTemplate<ImageTransformConfig>
  >();

  constructor(@Inject(MEDIA_STORAGE) private readonly storage: StorageDriver) {}

  async getOrThrow(key: string): Promise<YamlTemplate<ImageTransformConfig>> {
    const cached = this.cache.get(key);

    if (cached) {
      return cached;
    }

    try {
      const downloadStream = await this.storage.download(key);

      const yamlConfigTemplate =
        await YamlTemplate.create<ImageTransformConfig>(downloadStream, {
          overrideSchema: this.schemaPath,
        });

      this.cache.set(key, yamlConfigTemplate);
      return yamlConfigTemplate;
    } catch (error) {
      throw new Error(`Could not download config ${key}`, { cause: error });
    }
  }
}
