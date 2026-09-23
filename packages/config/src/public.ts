import type { AppConfig, Profile } from './schema.js';

/**
 * The only part of the configuration that may reach the browser bundle. Keep
 * it free of anything sensitive - it is inlined into public JavaScript.
 */
export interface PublicConfig {
  webUrl: string;
  apiBaseUrl: string;
  oidcIssuerUrl: string;
  imageServerUrl: string;

  post: Profile['post'];
  user: Profile['user'];
}

export function toPublicConfig(config: AppConfig): PublicConfig {
  return {
    webUrl: config.urls.web,
    apiBaseUrl: config.urls.apiProxy,
    oidcIssuerUrl: config.urls.auth,
    imageServerUrl: config.urls.imageServer,

    post: config.post,
    user: config.user,
  };
}
