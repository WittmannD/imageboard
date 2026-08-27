declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV: 'development' | 'production' | 'test';
      readonly VITE_BASE_URL: string;
      readonly VITE_IMAGE_SERVER_URL: string;
      readonly OIDC_ISSUER_URL: string;
      readonly OIDC_CLIENT_ID: string;
      readonly OIDC_CLIENT_SECRET: string;
      readonly OIDC_SESSION_MAX_AGE: string;
      readonly SESSION_COOKIE_SECRET: string;
      readonly IMAGEBOARD_API_URL: string;
    }
  }
}

export {};
