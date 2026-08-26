import * as process from 'node:process';
import * as client from 'openid-client';
import type { OidcAuthState } from 'src/.server/interfaces.ts';
import { install } from 'undici';

const server = new URL(process.env.OIDC_ISSUER_URI);
const clientId = process.env.OIDC_CLIENT_ID;
const clientSecret = process.env.OIDC_CLIENT_SECRET;

install();

const config: client.Configuration = await client.discovery(
  server,
  clientId,
  clientSecret,
  () => { /* empty */ },
  {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    execute: [client.allowInsecureRequests],
  },
);

/**
 * Value used in the authorization request as the redirect_uri parameter, this
 * is typically pre-registered at the Authorization Server.
 */
const redirectUri = new URL(
  'auth/callback',
  process.env['VITE_BASE_URL'],
).href;
const scope = 'openid email profile';

/**
 * PKCE: The following MUST be generated for every redirect to the
 * authorization_endpoint. You must store the code_verifier and state in the
 * end-user session such that it can be recovered as the user gets redirected
 * from the authorization server back to your application.
 */
async function buildAuthorizationUrl(): Promise<OidcAuthState & { url: URL }> {
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const nonce = client.randomNonce();
  let state!: string;

  const parameters: Record<string, string> = {
    scope,
    nonce,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  };

  if (!config.serverMetadata().supportsPKCE()) {
    /**
     * We cannot be sure the server supports PKCE so we're going to use state too.
     * Use of PKCE is backwards compatible even if the AS doesn't support it which
     * is why we're using it regardless. Like PKCE, random state must be generated
     * for every redirect to the authorization_endpoint.
     */
    state = client.randomState();
    parameters['state'] = state;
  }

  const url = client.buildAuthorizationUrl(config, parameters);
  return { url, codeVerifier, state, nonce };
}

async function authorizationCodeGrant(url: URL, state: OidcAuthState) {
  return await client.authorizationCodeGrant(
    config,
    url,
    {
      pkceCodeVerifier: state.codeVerifier,
      expectedState: state.state,
      expectedNonce: state.nonce,
    },
    {
      client_id: clientId,
      client_secret: clientSecret,
      scope,
    },
  );
}

async function refreshTokenGrant(refreshToken: string) {
  return await client.refreshTokenGrant(config, refreshToken, {
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  });
}

export { authorizationCodeGrant, buildAuthorizationUrl, refreshTokenGrant };
