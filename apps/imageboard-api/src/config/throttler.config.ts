import type { ThrottlerModuleOptions } from '@nestjs/throttler';

import { getConfig } from '@hdotu1/config';

const { throttle } = getConfig().api;

export default (): { throttler: ThrottlerModuleOptions } => ({
  throttler: [
    {
      name: 'default',
      ...throttle.default,
      skipIf: () => !getConfig().throttle.enabled,
    },
  ],
});

export const CREATE_POST_THROTTLE = { default: throttle.createPost };
