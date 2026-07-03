import { createReadStream } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { cwd } from 'node:process';
import * as process from 'node:process';
import readline from 'node:readline';
import { Readable } from 'node:stream';
import type { AnySchema } from 'ajv';

export function isDev() {
  return process.env['NODE_ENV'] !== 'production';
}

export function createSourceStream(
  input: string | Readable | Buffer,
  encoding: BufferEncoding = 'utf-8',
): Readable {
  if (input instanceof Readable) {
    return input;
  }

  if (input instanceof Buffer) {
    return Readable.from(input, { encoding });
  }

  return createReadStream(input, { encoding });
}

export async function getFirstYamlProperty(stream: Readable) {
  const PROPERTY_REGEX = /^\s*([^:\s]+)\s*:\s*(.+)$/;
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = PROPERTY_REGEX.exec(line);
    if (match) {
      rl.close();
      stream.destroy();

      const [, key, rawValue] = match;

      return {
        key,
        value: rawValue.replace(/^['"]|['"]$/g, ''),
      };
    }

    break;
  }

  return null;
}

export async function resolveSchemaPathFromYaml(
  input: string | Readable | Buffer,
) {
  const source = createSourceStream(input);

  let baseDir: string;
  if (typeof input === 'string') {
    baseDir = dirname(resolve(input));
  } else {
    baseDir = cwd();
  }

  const property = await getFirstYamlProperty(source);

  if (property?.key !== '$schema') {
    throw new Error('JSON schema must be on top of the YAML file');
  }

  const schemaPath = property.value;

  // If it's an actual URL (https://..., etc.)
  try {
    const url = new URL(schemaPath);
    if (['http:', 'https:'].includes(url.protocol)) {
      return { kind: 'url', url };
    }
  } catch {
    // not a URL → treat as path
  }

  // If "$schema" is a file:// URL
  if (schemaPath.startsWith('file://')) {
    const { fileURLToPath } = await import('node:url');

    const url = new URL(schemaPath);
    return { kind: 'file', path: fileURLToPath(url), url };
  }

  const { pathToFileURL } = await import('node:url');
  const absSchemaPath = resolve(baseDir, schemaPath);

  return {
    kind: 'file',
    path: absSchemaPath,
    url: pathToFileURL(absSchemaPath),
  };
}

export async function loadSchema(url: URL): Promise<AnySchema> {
  if (url.protocol === 'http:' || url.protocol === 'https:') {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch schema: ${url}`);
    }
    return (await res.json()) as AnySchema;
  }

  if (url.protocol === 'file:') {
    const { readFile } = await import('node:fs/promises');
    const { fileURLToPath } = await import('node:url');

    const filePath = fileURLToPath(url);
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as AnySchema;
  }

  throw new Error('Invalid schema URL protocol');
}
