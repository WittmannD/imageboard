export interface CreateUser {
  email: string;
  password: string;
  username: string;
}

export interface VerificationSession {
  purpose: 'email-verification';
  userId: string;
  otpHash: string;
  createdAt: number;
  ttl: number;
}