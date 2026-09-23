import {
  apiSecrets,
  getConfig,
  loadRootEnvFile,
  loadSecrets,
} from '@hdotu1/config';

/** The ConfigModule tree: the shared configuration (APP_ENV profile) plus this service's secrets. */
export default () => {
  loadRootEnvFile();

  return { ...getConfig(), secrets: loadSecrets(apiSecrets) };
};
