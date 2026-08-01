export type OpenIdProvider = 'google' | '';

export interface ExternalProfile {
  id: number | string;
  // Expected that this email already verified
  email: string;
  firstName?: string;
  lastName?: string;
}
