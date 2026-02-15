import { Buffer } from 'node:buffer';
import { once } from 'node:events';
import { Readable } from 'node:stream';
import sharp, { type Metadata } from 'sharp';

/**
 * Reads the first N bytes from a Readable, then puts them back,
 * so consumers will see the original stream content unchanged.
 *
 * Returns the peeked Buffer (length <= N if stream ends early).
 */
export async function peekMetadata(
  input: Readable,
  options?: { maxProbeBytes?: number },
): Promise<Metadata> {
  const maxProbeBytes = options?.maxProbeBytes ?? 512 * 1024;

  // Ensure paused mode
  input.pause();

  const chunks: Buffer[] = [];
  let total = 0;
  let metadata: Metadata | undefined;

  while (!metadata) {
    const chunk = input.read();

    if (chunk) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Buffer);
      chunks.push(buf);
      total += buf.length;

      if (total > maxProbeBytes) {
        throw new Error(
          `Metadata not found within ${maxProbeBytes.toString()} bytes`,
        );
      }

      try {
        metadata = await sharp(Buffer.concat(chunks)).metadata();
      } catch {
        // not enough bytes yet
      }

      continue;
    }

    if (input.readableEnded) break;

    await Promise.race([
      once(input, 'readable'),
      once(input, 'end'),
      once(input, 'error'),
    ]);
  }

  if (!metadata) {
    throw new Error('Input ended before metadata could be determined');
  }

  // Put bytes back BEFORE any pipe happens
  input.unshift(Buffer.concat(chunks));

  return metadata;
}
