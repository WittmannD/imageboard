export interface CreateUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AccountVerificationSession {
  interactionUid: string,
  userId: string
}