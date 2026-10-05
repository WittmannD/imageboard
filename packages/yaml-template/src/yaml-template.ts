import { randomUUID } from 'node:crypto';
import { type AnySchema, type ValidateFunction } from 'ajv';
import { Ajv2020 as Ajv } from 'ajv/dist/2020.js';
import yaml, { JSON_SCHEMA } from 'js-yaml';
import Mustache from 'mustache';

import {
  isDev,
  loadSchema,
  readSource,
  resolveSchemaUrl,
  resolveSchemaUrlFromYaml,
  type YamlSource,
} from './helpers.js';

export interface YamlTemplateOptions {
  /**
   * Schema used instead of the `$schema` property of the YAML file.
   * Either a schema object, a http(s)/file URL, or a path to a JSON/YAML
   * schema file (relative paths are resolved against the cwd).
   */
  overrideSchema?: AnySchema | string | URL;
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
    input: YamlSource,
    options: YamlTemplateOptions = {},
  ): Promise<YamlTemplate<T>> {
    const { overrideSchema } = options;
    const { raw, baseDir } = await readSource(input);
    const ajv = new Ajv({
      coerceTypes: true,
      schemaId: '$id',
      allErrors: isDev(),
    });
    const uuid = randomUUID();

    let schema: AnySchema;
    if (overrideSchema !== undefined && !isSchemaRef(overrideSchema)) {
      schema = overrideSchema;
    } else {
      const url =
        overrideSchema !== undefined
          ? resolveSchemaUrl(overrideSchema)
          : resolveSchemaUrlFromYaml(raw, baseDir);

      try {
        schema = await loadSchema(url);
      } catch (error) {
        throw new Error(`Failed to load schema: ${url}`, { cause: error });
      }
    }

    ajv.addSchema(schema, uuid);
    const validate = ajv.getSchema<T>(uuid);

    if (!validate) {
      throw new Error('Validation schema is missing');
    }

    return new YamlTemplate<T>(raw, validate, ajv);
  }

  /**
   * Interpolates the yaml config with the given context.
   */
  public resolve(context: AnyObject): T {
    const resolved = Mustache.render(
      this.raw,
      context,
      {},
      // values are interpolated into YAML, not HTML
      { tags: this.tags, escape: String },
    );
    const parsed = yaml.load(resolved, {
      schema: JSON_SCHEMA,
    }) as AnyObjectWithSchema | null;

    // do not validate $schema property and exclude it from the result object
    if (isObject(parsed)) {
      delete parsed.$schema;
    }

    const valid = this.validate(parsed);

    if (!valid) {
      const message = this.ajv.errorsText(this.validate.errors);

      if (isDev()) {
        console.error('YamlTemplate validation failed:', message);
      }

      throw new Error(message);
    }

    return parsed;
  }
}

function isSchemaRef(value: AnySchema | string | URL): value is string | URL {
  return typeof value === 'string' || value instanceof URL;
}

function isObject(value: unknown): value is AnyObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
