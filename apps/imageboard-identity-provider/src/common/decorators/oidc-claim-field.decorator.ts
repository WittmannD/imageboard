import 'reflect-metadata';

export const OIDC_CLAIM_FIELD = Symbol('OIDC_CLAIM_FIELD');

export function OidcClaimField(value: string): PropertyDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(
      OIDC_CLAIM_FIELD,
      value,
      target,
      propertyKey,
    );

    const props: string[] =
      Reflect.getMetadata('oidcClaims:properties', target) ?? [];

    if (!props.includes(propertyKey as string)) {
      props.push(propertyKey as string);
      Reflect.defineMetadata('oidcClaims:properties', props, target);
    }
  };
}
