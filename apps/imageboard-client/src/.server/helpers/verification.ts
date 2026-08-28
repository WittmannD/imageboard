interface VerificationRequestResult {
  sessionId: string;
}

interface VerificationCompleteResult {
  verified: boolean;
}

async function requestEmailVerification(userId: string) {
  const response = await fetch(
    new URL('/interactions/verification', process.env.OIDC_ISSUER_URL),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to request email verification');
  }

  return (await response.json()) as VerificationRequestResult;
}

async function completeEmailVerification(sessionId: string, otp: string) {
  const response = await fetch(
    new URL('/interactions/verification/complete', process.env.OIDC_ISSUER_URL),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, otp }),
    },
  );

  if (!response.ok) {
    return { verified: false };
  }

  return (await response.json()) as VerificationCompleteResult;
}

export { completeEmailVerification, requestEmailVerification };
