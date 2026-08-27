import type { OIDCDefinedConfig } from '../types/config.js';

export default (): OIDCDefinedConfig<'renderError'> => (context, out , _error) => {
  const url = new URL('error', process.env['INTERACTIONS_BASE_URL']);

  const error: typeof out = { ...out };

  if (process.env['NODE_ENV'] === 'production') {
    delete error.error_description;
  }

  const errorJson = JSON.stringify(out);
  const errorBase64 = Buffer.from(errorJson).toString('base64url');

  url.searchParams.set('error', errorBase64);

  context.response.redirect(url.href);
}