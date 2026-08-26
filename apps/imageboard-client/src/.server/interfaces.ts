export interface OidcAuthState {
  codeVerifier: string;
  state: string;
  nonce: string;
  returnTo?: string | null;
}

export interface ApiCredentials {
  accessToken: string;
  refreshToken: string;
}
