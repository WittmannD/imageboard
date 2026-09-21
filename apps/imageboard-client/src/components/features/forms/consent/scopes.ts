/**
 * What each scope the identity provider supports means to the person being
 * asked. Anything the provider learns to grant later shows up under its raw
 * name until it gets a line here.
 */
const SCOPE_DESCRIPTIONS: Record<string, string> = {
  openid: 'Know who you are on this service',
  profile: 'See your username',
  email: 'See your email address and whether it is verified',
  offline_access: 'Keep you signed in until you log out',
};

export function describeScope(scope: string): string {
  return SCOPE_DESCRIPTIONS[scope] ?? scope;
}
