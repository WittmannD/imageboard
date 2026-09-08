import { validate, type ValidatorOptions } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export async function validateShape<T extends object>(
  cls: new () => T,
  raw: unknown,
  options: ValidatorOptions = {},
): Promise<{ valid: true; data: T } | { valid: false; errors: string[] }> {
  const instance = plainToInstance(cls, raw ?? {});

  const errors = await validate(instance as object, {
    forbidNonWhitelisted: true,
    ...options
  });

  if (errors.length > 0) {
    return {
      valid: false,
      errors: errors.flatMap((e) => Object.values(e.constraints ?? {})),
    };
  }
  return { valid: true, data: instance };
}

