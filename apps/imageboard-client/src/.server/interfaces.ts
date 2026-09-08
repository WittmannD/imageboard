export interface OidcAuthState {
  codeVerifier: string;
  state: string;
  nonce: string;
  returnTo?: string | null;
}

export interface UserSession {
  sub: string;
  accessToken: string;
  refreshToken: string;
  email?: string;
  emailVerified?: boolean;
}
