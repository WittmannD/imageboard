import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';
import { pathToFileURL } from 'node:url';
import type { AnySchema } from 'ajv';
import yaml, { JSON_SCHEMA } from 'js-yaml';

export type YamlSource = string | Readable | Buffer;

export function isDev() {
  return process.env['NODE_ENV'] !== 'production';
}

/**
 * Reads the whole source once. A string input is treated as a file path,
 * relative schema paths are then resolved against its directory.
 */
export async function readSource(
  input: YamlSource,
  encoding: BufferEncoding = 'utf-8',
): Promise<{ raw: string; baseDir: string }> {
  if (input instanceof Readable) {
    return { raw: await text(input), baseDir: process.cwd() };
  }

  if (Buffer.isBuffer(input)) {
    return { raw: input.toString(encoding), baseDir: process.cwd() };
  }

  const filePath = resolve(input);
  return {
    raw: await readFile(filePath, encoding),
    baseDir: dirname(filePath),
  };
}

function parseScalar(rawValue: string): string {
  const value = rawValue.trim();
  const quote = value[0];

  if (quote === '"' || quote === "'") {
    const end = value.indexOf(quote, 1);
    return end === -1 ? value.slice(1) : value.slice(1, end);
  }

  // strip trailing inline comment
  return value.replace(/\s+#.*$/, '');
}

/**
 * Returns the first top-level property of a YAML document without parsing it
 * (the template may not be valid YAML until it is interpolated).
 */
export function getFirstYamlProperty(
  raw: string,
): { key: string; value: string } | null {
  const PROPERTY_REGEX = /^([^:\s#][^:\s]*)\s*:(?:\s+(.*))?$/;

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('%') ||
      trimmed === '---'
    ) {
      continue;
    }

    const match = PROPERTY_REGEX.exec(line.replace(/^\uFEFF/, ''));
    if (!match) {
      return null;
    }

    const [, key, rawValue = ''] = match;
    return { key: parseScalar(key), value: parseScalar(rawValue) };
  }

  return null;
}

/**
 * Resolves a schema reference (http(s)/file URL or a file path) to a URL.
 * Relative paths are resolved against baseDir.
 */
export function resolveSchemaUrl(
  ref: string | URL,
  baseDir: string = process.cwd(),
): URL {
  if (ref instanceof URL) {
    return ref;
  }

  try {
    const url = new URL(ref);
    // windows drive letters ("C:\...") are parsed as a protocol
    if (['http:', 'https:', 'file:'].includes(url.protocol)) {
      return url;
    }
  } catch {
    // not a URL → treat as path
  }

  return pathToFileURL(resolve(baseDir, ref));
}

export function resolveSchemaUrlFromYaml(raw: string, baseDir: string): URL {
  const property = getFirstYamlProperty(raw);

  if (property?.key !== '$schema' || !property.value) {
    throw new Error('JSON schema must be on top of the YAML file');
  }

  return resolveSchemaUrl(property.value, baseDir);
}

/**
 * Loads a JSON or YAML schema from a http(s) or file URL.
 */
export async function loadSchema(url: URL): Promise<AnySchema> {
  let content: string;

  if (url.protocol === 'http:' || url.protocol === 'https:') {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch schema: ${url} (${res.status})`);
    }
    content = await res.text();
  } else if (url.protocol === 'file:') {
    content = await readFile(url, 'utf8');
  } else {
    throw new Error(`Invalid schema URL protocol: ${url.protocol}`);
  }

  // YAML is a superset of JSON, so this handles both formats
  const schema = yaml.load(content, { schema: JSON_SCHEMA });

  if (
    typeof schema !== 'boolean' &&
    (typeof schema !== 'object' || schema === null || Array.isArray(schema))
  ) {
    throw new Error(`Schema is not an object: ${url}`);
  }

  return schema;
}
