import type { Configuration } from 'oidc-provider';

export type OIDCDefinedConfig<K extends keyof Configuration> = NonNullable<Configuration[K]>;
export type OIDCDefinedFeatureConfig<K extends keyof OIDCDefinedConfig<'features'>> = NonNullable<OIDCDefinedConfig<'features'>[K]>;
