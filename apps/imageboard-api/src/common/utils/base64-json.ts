export function decodeBase64Json(value: string): unknown {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(normalized, 'base64url').toString('utf8');
  return JSON.parse(json);
}

export function encodeBase64Json(value: unknown): string {
  const json = JSON.stringify(value);
  return Buffer.from(json, 'utf8').toString('base64url');
}
