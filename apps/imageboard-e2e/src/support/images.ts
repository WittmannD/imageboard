import { deflateSync } from 'node:zlib';

/**
 * Test images are generated rather than checked in: the repo's `tests/images`
 * folder is gitignored and excluded from the Docker context, and generating
 * them lets each spec pick the aspect ratios that matter to the layout engine.
 */

export interface ImageFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }

  return table;
})();

function crc32(data: Buffer): number {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));

  return Buffer.concat([length, body, crc]);
}

/** A valid 8-bit RGB PNG with a horizontal brightness gradient. */
export function createPng(
  width: number,
  height: number,
  [red, green, blue]: readonly [number, number, number],
): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: truecolour (RGB)

  const stride = 1 + width * 3; // one filter byte per scanline
  const raw = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y++) {
    const row = y * stride; // filter byte stays 0 (None)

    for (let x = 0; x < width; x++) {
      const shade = 0.4 + (0.6 * x) / width;
      const offset = row + 1 + x * 3;
      raw[offset] = Math.round(red * shade);
      raw[offset + 1] = Math.round(green * shade);
      raw[offset + 2] = Math.round(blue * shade);
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * One landscape, one portrait and one square image: a mix the layout engine
 * has to reconcile into a single collage.
 */
export function createTestImages(): ImageFile[] {
  return [
    {
      name: 'landscape.png',
      mimeType: 'image/png',
      buffer: createPng(1200, 800, [220, 80, 60]),
    },
    {
      name: 'portrait.png',
      mimeType: 'image/png',
      buffer: createPng(800, 1200, [60, 160, 90]),
    },
    {
      name: 'square.png',
      mimeType: 'image/png',
      buffer: createPng(1000, 1000, [70, 110, 220]),
    },
  ];
}
