export interface UnvalidatedOidcClaims {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
}

export interface OidcUserInfo extends UnvalidatedOidcClaims {
  sub: string;
  email: string;
  email_verified: boolean;
}

