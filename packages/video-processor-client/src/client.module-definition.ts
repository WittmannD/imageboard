import { ConfigurableModuleBuilder } from '@nestjs/common';

import type { VideoProcessorClientOptions } from './client-options.interface.js';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<VideoProcessorClientOptions>().build();
