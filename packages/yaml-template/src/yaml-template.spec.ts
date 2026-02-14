import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';

import { YamlTemplate } from './yaml-template.js';

interface MockConfigData {
  props: {
    num: number;
    bool: boolean;
    arr: string[];
    str: string;
  };
}

describe('YamlTemplate', () => {
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
      props: {
        type: 'object',
        properties: {
          num: {
            type: 'number',
          },
          bool: {
            type: 'boolean',
          },
          arr: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          str: {
            type: 'string',
          },
        },
      },
    },
    required: ['props'],
  };

  const source = () =>
    Readable.from(
      `props:
  num: \${{ nested.num }}
  bool: true
  arr: 
    - 'abc'
    - def
    - 4
  str: \${{ str }}`.split(/(?<=[\r\n])/),
      { encoding: 'utf-8' },
    );

  it('throws error if schema is missing', async () => {
    await expect(YamlTemplate.create(source())).rejects.toThrow();
    await expect(
      YamlTemplate.create(source(), { schema }),
    ).resolves.toBeDefined();
  });

  it('interpolates values', async () => {
    const yaml = await YamlTemplate.create<MockConfigData>(source(), {
      schema,
    });

    const result = yaml.resolve({
      str: 'abc',
      nested: {
        num: 123,
      },
    });

    expect(result).toEqual({
      props: {
        num: 123,
        bool: true,
        arr: ['abc', 'def', '4'],
        str: 'abc',
      },
    });
  });

  it('loads schema from $schema property', async () => {
    const source = './test/test-config.yaml';
    const yaml = await YamlTemplate.create<MockConfigData>(source);

    const result = yaml.resolve({
      str: 'abc',
      nested: {
        num: 123,
      },
    });

    expect(result).toEqual({
      props: {
        num: 123,
        bool: true,
        arr: ['abc', 'def', '4'],
        str: 'abc',
      },
    });
  });
});
