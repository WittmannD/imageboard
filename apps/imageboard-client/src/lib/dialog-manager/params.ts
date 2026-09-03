export function encodeDialogParams(params: unknown): string {
  const json = JSON.stringify(params);

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(json, 'utf-8').toString('base64url');
  }

  let binary = '';
  new TextEncoder().encode(json).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeDialogParams(encoded: string): object | null {
  try {
    if (typeof Buffer !== 'undefined') {
      const json = Buffer.from(encoded, 'base64url').toString('utf-8');
      return JSON.parse(json) as object;
    }

    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as object;
  } catch {
    return null;
  }
}
