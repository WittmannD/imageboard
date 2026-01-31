import { ConfigurableModuleBuilder } from '@nestjs/common';
import type {ImageProcessorClientOptions} from "./client-options.interface.js";

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ImageProcessorClientOptions>().build();
