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
  videoProcessor: videoProcessorConfig,
} = getConfig();

/** The ConfigModule tree: the shared configuration (APP_ENV profile) plus this service's secrets. */
export default () => {
  loadRootEnvFile();

  return { ...getConfig(), secrets: loadSecrets(apiSecrets) };
};

export const ALLOWED_AVATAR_FORMATS = userConfig.allowedAvatarFormats;
export const AVATAR_SIZE_LIMIT = userConfig.avatarSizeLimitBytes;

export const MAX_MEDIA_PER_POST = postConfig.maxMediaPerPost;
export const ALLOWED_POST_IMAGE_FORMATS = postConfig.allowedImageFormats;
export const POST_IMAGE_SIZE_LIMIT = postConfig.imageSizeLimitBytes;
export const ALLOWED_POST_VIDEO_FORMATS = postConfig.allowedVideoFormats;
export const POST_VIDEO_SIZE_LIMIT = postConfig.videoSizeLimitBytes;

export const IMAGE_PROCESSING_TIMEOUT = imageProcessorConfig.timeoutMs;
export const VIDEO_PROCESSING_TIMEOUT = videoProcessorConfig.timeoutMs;
export const VIDEO_PROBE_TIMEOUT = videoProcessorConfig.probeTimeoutMs;
