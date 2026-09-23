import {
  apiSecrets,
  getConfig,
  loadRootEnvFile,
  loadSecrets,
} from '@hdotu1/config';

const {
  user: userConfig,
  post: postConfig,
  imageProcessor: imageProcessorConfig,
} = getConfig();

/** The ConfigModule tree: the shared configuration (APP_ENV profile) plus this service's secrets. */
export default () => {
  loadRootEnvFile();

  return { ...getConfig(), secrets: loadSecrets(apiSecrets) };
};

export const ALLOWED_AVATAR_FORMATS = userConfig.allowedAvatarFormats;
export const AVATAR_SIZE_LIMIT = userConfig.avatarSizeLimitBytes;

export const MAX_IMAGES_PER_POST = postConfig.maxImagesPerPost;
export const ALLOWED_POST_IMAGE_FORMATS = postConfig.allowedImageFormats;
export const POST_IMAGE_SIZE_LIMIT = postConfig.imageSizeLimitBytes;

export const IMAGE_PROCESSING_TIMEOUT = imageProcessorConfig.timeoutMs;
