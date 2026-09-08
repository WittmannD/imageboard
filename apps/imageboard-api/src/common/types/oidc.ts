export interface UnvalidatedOidcClaims {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  preferred_username?: string;
}

export interface OidcUserInfo extends UnvalidatedOidcClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  preferred_username: string;
}

