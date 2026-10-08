import { publicConfig } from 'src/lib/config.ts';
import type {
  ImageSource,
  MediaDto,
  MediaSource,
} from 'src/services/api/types.ts';

export function getImageByVariant<T extends ImageSource = ImageSource>(
  sources: ImageSource[],
  variant: NonNullable<T['metadata']>['variant'],
): T | null {
  return (sources.find((source) => source.metadata?.variant === variant) ??
    null) as T | null;
}

export function getImageUrl(key: string) {
  return `${publicConfig.imageServerUrl}/${key}`;
}

/** The derivatives of videos, posters included, live in the video bucket. */
export function getMediaUrl(media: MediaDto, key: string) {
  return media.type === 'Video'
    ? `${publicConfig.videoServerUrl}/${key}`
    : getImageUrl(key);
}

/** The still a gallery tile shows: an image's tile, a video's tile poster. */
export function getTileSource(media: MediaDto): MediaSource | null {
  return getImageByVariant<MediaSource>(
    media.sourceSet,
    media.type === 'Video' ? 'tilePoster' : 'tile',
  );
}

/** The large still: an image's lightbox size, a video's poster. */
export function getLightboxSource(media: MediaDto): MediaSource | null {
  return getImageByVariant<MediaSource>(
    media.sourceSet,
    media.type === 'Video' ? 'poster' : 'lightbox',
  );
}
