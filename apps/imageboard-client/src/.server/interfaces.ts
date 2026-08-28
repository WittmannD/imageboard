export interface OidcAuthState {
  codeVerifier: string;
  state: string;
  nonce: string;
  returnTo?: string | null;
}

export interface Credentials {
  sub: string;
  accessToken: string;
  refreshToken: string;
}
