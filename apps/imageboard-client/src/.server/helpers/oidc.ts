import * as process from 'node:process';
import * as client from 'openid-client';
import { validateShape } from 'src/.server/helpers/validate.ts';
import type { OidcAuthState } from 'src/.server/interfaces.ts';
import { TokenResponseModel } from 'src/.server/models/token-response.model.ts';
import { install } from 'undici';

const server = new URL(process.env.OIDC_ISSUER_URL);
const clientId = process.env.OIDC_CLIENT_ID;
const clientSecret = process.env.OIDC_CLIENT_SECRET;

install();

const config: client.Configuration = await client.discovery(
  server,
  clientId,
  clientSecret,
  () => {
    /* empty */
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    execute: [client.allowInsecureRequests],
  },
);

/**
 * Value used in the authorization request as the redirect_uri parameter, this
 * is typically pre-registered at the Authorization Server.
 */
const redirectUri = new URL('/auth/callback', process.env.VITE_BASE_URL).href;
const scope = 'openid email profile offline_access';

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
    // oidc-provider strips the offline_access scope (and thus never issues a
    // refresh_token) unless prompt=consent is present on the authorization
    // request - see check_scope.js. The identity-provider trusts this client
    // (TRUSTED_METADATA_PROPERTY) so this does not show a real consent screen,
    // it just lets loadExistingGrant auto-approve the requested scopes.
    prompt: 'consent',
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
  const result = await client.authorizationCodeGrant(
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
    },
  );

  return await validateShape(
    TokenResponseModel,
    {
      ...result,
      claims: result.claims(),
    },
    {
      whitelist: false,
      forbidNonWhitelisted: false,
    },
  );
}

async function refreshTokenGrant(refreshToken: string) {
  const result = await client.refreshTokenGrant(config, refreshToken, {
    client_id: clientId,
    client_secret: clientSecret,
  });

  return await validateShape(
    TokenResponseModel,
    {
      ...result,
      claims: result.claims(),
    },
    {
      whitelist: false,
      forbidNonWhitelisted: false,
    },
  );
}

async function getUserInfo(accessToken: string, sub: string) {
  return await client.fetchUserInfo(config, accessToken, sub);
}

function buildEndSessionUrl(params: {
  idTokenHint: string;
  postLogoutRedirectUri: string;
}): URL {
  return client.buildEndSessionUrl(config, {
    id_token_hint: params.idTokenHint,
    post_logout_redirect_uri: params.postLogoutRedirectUri,
  });
}

/**
 * Best-effort: kills the tokens themselves in case the browser never
 * completes the RP-Initiated Logout redirect (e.g. JS disabled, tab closed,
 * network drop). RP-Initiated Logout remains the source of truth for ending
 * the identity provider's own session.
 */
async function revokeTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  await Promise.allSettled([
    client.tokenRevocation(config, tokens.accessToken, {
      token_type_hint: 'access_token',
    }),
    client.tokenRevocation(config, tokens.refreshToken, {
      token_type_hint: 'refresh_token',
    }),
  ]);
}

export {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  buildEndSessionUrl,
  getUserInfo,
  refreshTokenGrant,
  revokeTokens,
};
