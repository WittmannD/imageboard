import { SetMetadata } from '@nestjs/common';


export const SKIP_EMAIL_VERIFICATION = 'skipEmailVerification';

/**
 * A decorator used to indicate whether email verification is bypassed for a specific operation.
 *
 * This decorator is a function that sets metadata to signal skipping the email verification
 * process. Typically used in scenarios where email verification is unnecessary or should
 * temporarily be disabled for certain application workflows.
 */
export const SkipEmailVerification = () =>
  SetMetadata(SKIP_EMAIL_VERIFICATION, true);
