export interface CreateUser {
  email: string;
  password: string;
  username: string;
}

export interface VerificationSession {
  purpose: 'email-verification' | 'password-reset' | 'mfa';
  userId: string;
  otpHash: string;
  createdAt: number;
  ttl: number;
}