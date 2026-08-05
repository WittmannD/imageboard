import type { OIDCDefinedConfig } from '../types/config.js';

export default (): OIDCDefinedConfig<'pairwiseIdentifier'> => (_context, accountId, _client) => {
  // Pairwise identifier is not implemented.
  // We use a single first party client and trust him with the account id.
  return accountId;
}