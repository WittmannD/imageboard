import { env } from '../env.js';
import { type PollOptions, pollUntil } from './poll.js';

interface MessageSummary {
  ID: string;
  Created: string;
  Subject: string;
}

export interface Message extends MessageSummary {
  HTML: string;
  Text: string;
}

async function mailpit<T>(path: string): Promise<T> {
  const response = await fetch(`${env.mailpitUrl}/api/v1${path}`);

  if (!response.ok) {
    throw new Error(`Mailpit ${path} responded with ${response.status}`);
  }

  return (await response.json()) as T;
}

/**
 * The newest message addressed to `address` (optionally with `subject`), or
 * `null` if none arrived yet.
 */
export async function findLatestMessageTo(
  address: string,
  subject?: string,
): Promise<Message | null> {
  const query = subject
    ? `to:${address} subject:"${subject}"`
    : `to:${address}`;
  // Mailpit returns search results newest first.
  const { messages } = await mailpit<{ messages: MessageSummary[] }>(
    `/search?query=${encodeURIComponent(query)}`,
  );
  const latest = messages.at(0);

  return latest ? await mailpit<Message>(`/message/${latest.ID}`) : null;
}

/** Pulls the 6-digit one-time code out of the identity provider's email. */
export function extractOtp(message: Message): string {
  // The template renders the code as `<code>123456</code>`.
  const match =
    /<code>\s*(\d{6})\s*<\/code>/.exec(message.HTML) ??
    /\b(\d{6})\b/.exec(message.Text);

  if (!match?.[1]) {
    throw new Error(
      `No 6-digit code found in email "${message.Subject}" (${message.ID})`,
    );
  }

  return match[1];
}

export async function waitForOtp(
  address: string,
  options?: PollOptions,
): Promise<string> {
  const message = await pollUntil(
    `a verification email for ${address}`,
    () => findLatestMessageTo(address),
    options,
  );

  return extractOtp(message);
}

const RESET_EMAIL_SUBJECT = 'Reset your password';

/** Pulls the reset link (token in its fragment) out of the identity provider's email. */
export function extractResetLink(message: Message): string {
  const match = /href="([^"]*reset-password#[^"]*)"/.exec(message.HTML);

  if (!match?.[1]) {
    throw new Error(
      `No reset link found in email "${message.Subject}" (${message.ID})`,
    );
  }

  return match[1];
}

export async function waitForResetLink(
  address: string,
  options?: PollOptions,
): Promise<string> {
  const message = await pollUntil(
    `a password reset email for ${address}`,
    () => findLatestMessageTo(address, RESET_EMAIL_SUBJECT),
    options,
  );

  return extractResetLink(message);
}
