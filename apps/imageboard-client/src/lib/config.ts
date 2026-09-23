import type { PublicConfig } from '@hdotu1/config/public';

/** Inlined at build time by vite.config.ts from the APP_ENV profile. */
declare const __PUBLIC_CONFIG__: PublicConfig;

/** The browser-safe part of the shared configuration. */
export const publicConfig: PublicConfig = __PUBLIC_CONFIG__;
