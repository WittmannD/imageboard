import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getFirstYamlProperty,
  loadSchema,
  readSource,
  resolveSchemaUrl,
  resolveSchemaUrlFromYaml,
} from './helpers.js';

const testDir = resolve(import.meta.dirname, '../test');

describe('getFirstYamlProperty', () => {
  it.each([
    ['$schema: ./a.json', './a.json'],
    ["$schema: './a.json'", './a.json'],
    ['$schema: "./a.json"', './a.json'],
    ['"$schema": ./a.json', './a.json'],
    ['$schema: ./a.json # comment', './a.json'],
    ["$schema: './a #b.json' # comment", './a #b.json'],
    ['$schema: https://example.com/a.json', 'https://example.com/a.json'],
  ])('parses %s', (line, value) => {
    expect(getFirstYamlProperty(line)).toEqual({ key: '$schema', value });
  });

  it('skips comments, blank lines, directives and document start', () => {
    const raw = '﻿%YAML 1.2\r\n# comment\r\n\r\n---\r\n$schema: x.json\r\na: 1';
    expect(getFirstYamlProperty(raw)).toEqual({
      key: '$schema',
      value: 'x.json',
    });
  });

  it('returns the first property only', () => {
    expect(getFirstYamlProperty('a: 1\n$schema: x.json')).toEqual({
      key: 'a',
      value: '1',
    });
  });

  it('returns null when there is no property', () => {
    expect(getFirstYamlProperty('')).toBeNull();
    expect(getFirstYamlProperty('- item')).toBeNull();
  });
});

describe('resolveSchemaUrl', () => {
  it('keeps http(s) and file URLs', () => {
    expect(resolveSchemaUrl('https://example.com/s.json').href).toBe(
      'https://example.com/s.json',
    );
    const fileUrl = pathToFileURL(resolve(testDir, 'test.schema.json'));
    expect(resolveSchemaUrl(fileUrl.href).href).toBe(fileUrl.href);
    expect(resolveSchemaUrl(fileUrl)).toBe(fileUrl);
  });

  it('resolves relative paths against the base dir', () => {
    expect(resolveSchemaUrl('./s.json', testDir).href).toBe(
      pathToFileURL(resolve(testDir, 's.json')).href,
    );
  });

  it('resolves relative paths against cwd by default', () => {
    expect(resolveSchemaUrl('s.json').href).toBe(
      pathToFileURL(resolve('s.json')).href,
    );
  });

  it('treats absolute paths as files', () => {
    const abs = resolve(testDir, 's.json');
    expect(resolveSchemaUrl(abs).href).toBe(pathToFileURL(abs).href);
  });
});

describe('resolveSchemaUrlFromYaml', () => {
  it('throws if $schema is not the first property', () => {
    expect(() => resolveSchemaUrlFromYaml('a: 1', testDir)).toThrow(
      /must be on top/,
    );
    expect(() => resolveSchemaUrlFromYaml('$schema:', testDir)).toThrow(
      /must be on top/,
    );
  });
});

describe('readSource', () => {
  it('reads a file path and uses its directory as base dir', async () => {
    const { raw, baseDir } = await readSource(
      resolve(testDir, 'test-config.yaml'),
    );
    expect(raw).toContain('$schema');
    expect(baseDir).toBe(testDir);
  });

  it('reads buffers and streams relative to cwd', async () => {
    await expect(readSource(Buffer.from('a: 1'))).resolves.toEqual({
      raw: 'a: 1',
      baseDir: process.cwd(),
    });
    await expect(readSource(Readable.from(['a: ', '1']))).resolves.toEqual({
      raw: 'a: 1',
      baseDir: process.cwd(),
    });
  });
});

describe('loadSchema', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads JSON and YAML schema files', async () => {
    const json = await loadSchema(
      pathToFileURL(resolve(testDir, 'test.schema.json')),
    );
    const yaml = await loadSchema(
      pathToFileURL(resolve(testDir, 'test.schema.yaml')),
    );
    expect(json).toEqual(yaml);
    expect(json).toMatchObject({ type: 'object', required: ['props'] });
  });

  it('fetches schemas over http', async () => {
    const fetchMock = vi.fn(async () => new Response('{"type":"object"}'));
    vi.stubGlobal('fetch', fetchMock);

    const url = new URL('https://example.com/s.json');
    await expect(loadSchema(url)).resolves.toEqual({ type: 'object' });
    expect(fetchMock).toHaveBeenCalledWith(url);
  });

  it('throws on failed http responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404 })),
    );
    await expect(
      loadSchema(new URL('https://example.com/s.json')),
    ).rejects.toThrow(/404/);
  });

  it('throws on unsupported protocols and non-object schemas', async () => {
    await expect(loadSchema(new URL('ftp://example.com/s'))).rejects.toThrow(
      /protocol/,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('[1]')),
    );
    await expect(
      loadSchema(new URL('https://example.com/s.json')),
    ).rejects.toThrow(/not an object/);
  });
});
