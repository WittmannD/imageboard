/** What the consent screen shows, see `GET /interactions/:uid/consent`. */
export interface ConsentDetails {
  client: {
    id: string;
    name: string;
    uri?: string;
    logoUri?: string;
    policyUri?: string;
    tosUri?: string;
  };
  account: { username: string; email: string };
  /** The scopes the client asked for, out of those this provider supports. */
  scopes: string[];
}
