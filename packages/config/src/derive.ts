import type { Profile, Urls } from './schema.js';

/** Every URL that follows from the profile's domain and service layout. */
export function deriveUrls(profile: Profile): Urls {
  const { scheme, domain } = profile;
  const web = `${scheme}://${domain}`;
  const { client } = profile.identityProvider.oidc;

  return {
    web,
    apiProxy: `${web}/api`,
    api: `${scheme}://api.${domain}`,
    auth: `${scheme}://auth.${domain}`,
    interactions: `${web}/auth/`,
    imageServer: profile.imageServerUrl,
    oidcRedirectUris: [`${web}/auth/callback`, ...client.extraRedirectUris],
    oidcPostLogoutRedirectUris: [
      `${web}/`,
      ...client.extraPostLogoutRedirectUris,
    ],
    internal: {
      api: `http://${profile.api.internalHost}:${profile.api.port}`,
      identityProvider: `http://${profile.identityProvider.internalHost}:${profile.identityProvider.port}`,
      client: `http://${profile.client.internalHost}:${profile.client.port}`,
    },
  };
}
