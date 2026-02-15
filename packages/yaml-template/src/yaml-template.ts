import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';
import { type AnySchema, type ValidateFunction } from 'ajv';
import { Ajv2020 as Ajv } from 'ajv/dist/2020.js';
import yaml, { JSON_SCHEMA } from 'js-yaml';
import Mustache from 'mustache';

import {
  createSourceStream,
  isDev,
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

export class YamlTemplate<T extends AnyObject> {
  private readonly tags: [string, string] = ['${{', '}}'];

  private constructor(
    private readonly raw: string,
    private readonly validate: ValidateFunction<T>,
    private readonly ajv: Ajv,
  ) {}

  static async create<T extends AnyObject>(
    input: string | Readable | Buffer,
    options: YamlTemplateOptions = {},
  ): Promise<YamlTemplate<T>> {
    const source = createSourceStream(input);
    const { schema } = options;
    const ajv = new Ajv({
      coerceTypes: true,
      schemaId: '$id',
      allErrors: isDev(),
    });
    const uuid = randomUUID();

    if (schema) {
      ajv.addSchema(schema, uuid);
    }

    if (!schema) {
      const { url } = await resolveSchemaPathFromYaml(input);
      let jsonSchema;

      try {
        jsonSchema = await loadSchema(url);
      } catch (error) {
        throw new Error('Failed to load schema', { cause: error });
      }

      ajv.addSchema(jsonSchema, uuid);
    }

    const raw = await text(source);
    const validate = ajv.getSchema<T>(uuid);

    if (!validate) {
      throw new Error('Validation schema is missing');
    }

    return new YamlTemplate<T>(raw, validate, ajv);
  }

  public resolve(context: AnyObject): T {
    const resolved = Mustache.render(this.raw, context, {}, this.tags);
    const parsed = yaml.load(resolved, {
      schema: JSON_SCHEMA,
    }) as AnyObjectWithSchema;

    // do not validate $schema property and exclude it from the result object
    delete parsed.$schema;
    const valid = this.validate(parsed);

    if (!valid) {
      if (isDev()) {
        console.error(
          'YamlTemplate validation failed:',
          this.ajv.errorsText(this.validate.errors),
        );
      }

      throw new Error(this.ajv.errorsText(this.validate.errors));
    }

    return parsed;
  }
}
