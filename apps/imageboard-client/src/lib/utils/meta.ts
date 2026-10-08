import type { MetaDescriptor } from 'react-router';
import { publicConfig } from 'src/lib/config.ts';
import { getLightboxSource, getMediaUrl } from 'src/lib/utils/image-source.ts';
import type { PostDto } from 'src/services/api/types.ts';

export const SITE_NAME = 'spottish.website';
export const DESCRIPTION_MAX_LENGTH = 200;

function truncate(text: string, maxLength: number) {
  return text.length > maxLength
    ? `${text.slice(0, maxLength - 1).trimEnd()}…`
    : text;
}

// e.g. "2 photos and 1 video"
function describeMedia(post: PostDto) {
  const count = (type: 'Image' | 'Video') =>
    post.media.filter((media) => media.type === type).length;
  const plural = (n: number, noun: string) =>
    `${String(n)} ${noun}${n === 1 ? '' : 's'}`;
  const images = count('Image');
  const videos = count('Video');

  return [
    images ? plural(images, 'photo') : null,
    videos ? plural(videos, 'video') : null,
  ]
    .filter((part) => part !== null)
    .join(' and ');
}

export function buildPostMeta(post: PostDto): MetaDescriptor[] {
  const author = `@${post.user.username}`;
  const title = `Post by ${author} · ${SITE_NAME}`;
  const caption = post.caption?.replace(/\s+/g, ' ').trim();
  const description = caption
    ? truncate(caption, DESCRIPTION_MAX_LENGTH)
    : `${describeMedia(post)} by ${author}`;
  const url = `${publicConfig.webUrl}/posts/${post.id}`;
  const preview = post.media
    .map((media) => ({ media, image: getLightboxSource(media) }))
    .find(({ image }) => image !== null);
  const image = preview?.image ?? null;
  const imageUrl =
    preview?.image && getMediaUrl(preview.media, preview.image.key);

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:type', content: 'article' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'article:published_time', content: post.createdAt },
    ...(image && imageUrl
      ? [
          { property: 'og:image', content: imageUrl },
          { property: 'og:image:type', content: image.mimetype },
          { property: 'og:image:width', content: String(image.width) },
          { property: 'og:image:height', content: String(image.height) },
          { property: 'og:image:alt', content: description },
        ]
      : []),
    {
      name: 'twitter:card',
      content: image ? 'summary_large_image' : 'summary',
    },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    ...(imageUrl ? [{ name: 'twitter:image', content: imageUrl }] : []),
    // only the author gets a post that isn't published; keep it out of indexes
    ...(post.status === 'Published'
      ? []
      : [{ name: 'robots', content: 'noindex' }]),
  ];
}
