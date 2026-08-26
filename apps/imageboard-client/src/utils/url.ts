export function replaceBaseUrl(originalUrl: string | URL, newBaseUrl: string | URL) {
  const parsed = new URL(originalUrl);
  const relativePart = parsed.pathname + parsed.search + parsed.hash;
  return new URL(relativePart, newBaseUrl);
}
