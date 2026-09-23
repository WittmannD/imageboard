import {
  clientSecrets,
  getConfig,
  loadRootEnvFile,
  loadSecrets,
} from '@hdotu1/config';

loadRootEnvFile();

/** Server-only: the shared configuration (APP_ENV profile). */
export const config = getConfig();

/** Server-only: this service's secrets, from the environment. */
export const secrets = loadSecrets(clientSecrets);
