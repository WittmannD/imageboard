import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';
import { Ajv, type AnySchema, type ValidateFunction } from 'ajv';
import yaml, { JSON_SCHEMA } from 'js-yaml';
import Mustache from 'mustache';

import {
  createSourceStream,
  loadSchema,
  resolveSchemaPathFromYaml,
} from './helpers.js';

export interface YamlTemplateOptions {
  schema?: AnySchema;
}

interface WithSchema {
  $schema?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyObject = Record<any, any>;
export type AnyObjectWithSchema = AnyObject & WithSchema;

export class YamlTemplate<T extends AnyObjectWithSchema> {
  private readonly tags: [string, string] = ['${{', '}}'];
  private constructor(
    private readonly raw: string,
    private readonly validate: ValidateFunction<T>,
    private readonly ajv: Ajv,
  ) {}

  static async create<T extends AnyObjectWithSchema>(
    input: string | Readable | Buffer,
    options: YamlTemplateOptions = {},
  ): Promise<YamlTemplate<T>> {
    const source = createSourceStream(input);
    const { schema } = options;
    const ajv = new Ajv({ coerceTypes: true });
    const uuid = randomUUID();

    if (schema) {
      ajv.addSchema(schema, uuid);
    }

    if (!schema) {
      const { url } = await resolveSchemaPathFromYaml(input);
      const jsonSchema = await loadSchema(url);
      ajv.addSchema(jsonSchema, uuid);
    }

    const raw = await text(source);
    const validate = ajv.getSchema<T>(uuid);

    if (!validate) {
      throw new Error('Validation schema is missing');
    }

    return new YamlTemplate<T>(raw, validate, ajv);
  }

  public resolve(context: Record<string, unknown>) {
    const resolved = Mustache.render(this.raw, context, {}, this.tags);
    const parsed = yaml.load(resolved, {
      schema: JSON_SCHEMA,
    }) as AnyObjectWithSchema;
    const valid = this.validate(parsed);

    if (!valid) {
      throw new Error(this.ajv.errorsText(this.validate.errors));
    }

    delete parsed.$schema;
    return parsed;
  }
}
