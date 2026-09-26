declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV: 'development' | 'production' | 'test';
      /** Selects the configuration profile, see @hdotu1/config. */
      readonly APP_ENV?: 'development' | 'e2e' | 'staging' | 'production';
    }
  }
}

export {};
