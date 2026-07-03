import { ConfigurableModuleBuilder } from '@nestjs/common';

import type { StorageDriver } from '../drivers/index.js';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<StorageDriver>().build();
