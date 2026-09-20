import { buildErrorRedirect } from '../../common/helpers/build-error-redirect.js';
import type { OIDCDefinedConfig } from '../types/config.js';

export default (): OIDCDefinedConfig<'renderError'> => (context, out) => {
  context.response.redirect(
    buildErrorRedirect(process.env['INTERACTIONS_BASE_URL'] ?? '', out),
  );
}