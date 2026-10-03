import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { YamlTemplate } from './yaml-template.js';

interface MockConfigData {
  props: {
    num: number;
    bool: boolean;
    arr: string[];
    str: string;
  };
}

const testDir = resolve(import.meta.dirname, '../test');
const configPath = resolve(testDir, 'test-config.yaml');
const jsonSchemaPath = resolve(testDir, 'test.schema.json');
const yamlSchemaPath = resolve(testDir, 'test.schema.yaml');

describe('YamlTemplate', () => {
  const schema = JSON.parse(readFileSync(jsonSchemaPath, 'utf-8'));

  const context = {
    str: 'abc',
    nested: {
      num: 123,
    },
  };

  const expected = {
    props: {
      num: 123,
      bool: true,
      arr: ['abc', 'def', '4'],
      str: 'abc',
    },
  };

  const body = `props:
  num: \${{ nested.num }}
  bool: true
  arr:
    - 'abc'
    - def
    - 4
  str: \${{ str }}`;

  const source = (content = body) =>
    Readable.from(content.split(/(?<=[\r\n])/), { encoding: 'utf-8' });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('throws error if schema is missing', async () => {
    await expect(YamlTemplate.create(source())).rejects.toThrow(
      /must be on top/,
    );
    await expect(
      YamlTemplate.create(source(), { overrideSchema: schema }),
    ).resolves.toBeDefined();
  });

  it('interpolates values', async () => {
    const yaml = await YamlTemplate.create<MockConfigData>(source(), {
      overrideSchema: schema,
    });

    expect(yaml.resolve(context)).toEqual(expected);
  });

  it('does not html-escape interpolated values', async () => {
    const yaml = await YamlTemplate.create<MockConfigData>(source(), {
      overrideSchema: schema,
    });

    const result = yaml.resolve({ ...context, str: 'a/b & <c>' });
    expect(result.props.str).toBe('a/b & <c>');
  });

  it('can be resolved multiple times', async () => {
    const yaml = await YamlTemplate.create<MockConfigData>(source(), {
      overrideSchema: schema,
    });

    expect(yaml.resolve({ ...context, str: 'one' }).props.str).toBe('one');
    expect(yaml.resolve({ ...context, str: 'two' }).props.str).toBe('two');
  });

  it('throws if the resolved config is invalid', async () => {
    const yaml = await YamlTemplate.create<MockConfigData>(source('props: 1'), {
      overrideSchema: schema,
    });

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => yaml.resolve(context)).toThrow(/props/);
  });

  it('throws a validation error instead of crashing on an empty document', async () => {
    const yaml = await YamlTemplate.create<MockConfigData>(source('# empty'), {
      overrideSchema: schema,
    });

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => yaml.resolve(context)).toThrow(/must be object/);
  });

  describe('$schema property', () => {
    it('loads schema relative to the yaml file path', async () => {
      const yaml = await YamlTemplate.create<MockConfigData>(configPath);

      const result = yaml.resolve(context);
      expect(result).toEqual(expected);
      expect(result).not.toHaveProperty('$schema');
    });

    it('loads schema from a stream input', async () => {
      const yaml = await YamlTemplate.create<MockConfigData>(
        source(`$schema: ${pathToFileURL(yamlSchemaPath).href}\n${body}`),
      );

      expect(yaml.resolve(context)).toEqual(expected);
    });

    it('loads schema from a buffer input relative to cwd', async () => {
      const yaml = await YamlTemplate.create<MockConfigData>(
        Buffer.from(`$schema: '${jsonSchemaPath}' # comment\n${body}`),
      );

      expect(yaml.resolve(context)).toEqual(expected);
    });

    it('loads schema from a URL', async () => {
      const fetchMock = vi.fn(async () => Response.json(schema));
      vi.stubGlobal('fetch', fetchMock);

      const yaml = await YamlTemplate.create<MockConfigData>(
        source(`$schema: https://example.com/schema.json\n${body}`),
      );

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(yaml.resolve(context)).toEqual(expected);
    });

    it('throws if the schema cannot be loaded', async () => {
      await expect(
        YamlTemplate.create(source(`$schema: ./missing.json\n${body}`)),
      ).rejects.toThrow(/Failed to load schema/);
    });
  });

  describe('overrideSchema', () => {
    // $schema points to a missing file, so it must not be used
    const withBrokenSchema = () => source(`$schema: ./missing.json\n${body}`);

    it('accepts a schema object', async () => {
      const yaml = await YamlTemplate.create<MockConfigData>(
        withBrokenSchema(),
        { overrideSchema: schema },
      );

      expect(yaml.resolve(context)).toEqual(expected);
    });

    it.each([
      ['an absolute JSON path', jsonSchemaPath],
      ['an absolute YAML path', yamlSchemaPath],
      ['a file URL string', pathToFileURL(yamlSchemaPath).href],
      ['a file URL', pathToFileURL(jsonSchemaPath)],
    ])('accepts %s', async (_, overrideSchema) => {
      const yaml = await YamlTemplate.create<MockConfigData>(
        withBrokenSchema(),
        { overrideSchema },
      );

      expect(yaml.resolve(context)).toEqual(expected);
    });

    it('resolves relative paths against cwd', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue(testDir);

      const yaml = await YamlTemplate.create<MockConfigData>(
        withBrokenSchema(),
        { overrideSchema: './test.schema.yaml' },
      );

      expect(yaml.resolve(context)).toEqual(expected);
    });

    it('accepts a http URL', async () => {
      const fetchMock = vi.fn(async () => Response.json(schema));
      vi.stubGlobal('fetch', fetchMock);

      const yaml = await YamlTemplate.create<MockConfigData>(
        withBrokenSchema(),
        { overrideSchema: 'https://example.com/schema.json' },
      );

      expect(fetchMock).toHaveBeenCalledWith(
        new URL('https://example.com/schema.json'),
      );
      expect(yaml.resolve(context)).toEqual(expected);
    });

    it('throws if the override schema cannot be loaded', async () => {
      await expect(
        YamlTemplate.create(source(), {
          overrideSchema: resolve(testDir, 'missing.json'),
        }),
      ).rejects.toThrow(/Failed to load schema/);
    });
  });
});
