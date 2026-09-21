import { errors } from 'oidc-provider';

import type { OIDCDefinedConfig } from '../types/config.js';

export const CORS_METADATA_PROPERTY = 'urn:custom:client:allowed-cors-origins';

const isOrigin = (value: unknown) => {
  return typeof value === 'string' && URL.parse(value)?.origin === value;
};

const validator: OIDCDefinedConfig<'extraClientMetadata'>['validator'] = (
  _context,
  key,
  value,
  metadata,
) => {
  if (key === CORS_METADATA_PROPERTY) {
    // set default (no CORS)
    if (value === undefined) {
      metadata[CORS_METADATA_PROPERTY] = [];
      return;
    }
    // validate an array of Origin strings
    if (!Array.isArray(value) || !value.every(isOrigin)) {
      throw new errors.InvalidClientMetadata(
        `${CORS_METADATA_PROPERTY} must be an array of origins`,
      );
    }
  }
};

export default () =>
  ({
    properties: [CORS_METADATA_PROPERTY],
    validator,
  }) satisfies OIDCDefinedConfig<'extraClientMetadata'>;
