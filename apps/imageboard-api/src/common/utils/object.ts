export function prototypeToObject(
  prototype: object,
): Record<string, unknown> {
  const methods: Record<string, unknown> = {};

  for (const key of Object.getOwnPropertyNames(prototype)) {
    if (key === 'constructor') continue;

    const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
    if (descriptor && typeof descriptor.value === 'function') {
      methods[key] = descriptor.value;
    }
  }

  return methods;
}
