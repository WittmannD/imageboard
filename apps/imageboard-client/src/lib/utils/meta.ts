import type { MetaDescriptor } from 'react-router';
import { publicConfig } from 'src/lib/config.ts';
import { getImageByVariant, getImageUrl } from 'src/lib/utils/image-source.ts';
import type { PhotoSource, PostDto } from 'src/services/api/types.ts';

export const SITE_NAME = 'spottish.website';
export const DESCRIPTION_MAX_LENGTH = 200;

function truncate(text: string, maxLength: number) {
  return text.length > maxLength
    ? `${text.slice(0, maxLength - 1).trimEnd()}…`
    : text;
}

export function buildPostMeta(post: PostDto): MetaDescriptor[] {
  const author = `@${post.user.username}`;
  const title = `Post by ${author} · ${SITE_NAME}`;
  const caption = post.caption?.replace(/\s+/g, ' ').trim();
  const photoCount = post.photos.length;
  const description = caption
    ? truncate(caption, DESCRIPTION_MAX_LENGTH)
    : `${photoCount} ${photoCount === 1 ? 'photo' : 'photos'} by ${author}`;
  const url = `${publicConfig.webUrl}/posts/${post.id}`;
  const image = post.photos
    .map((photo) => getImageByVariant<PhotoSource>(photo.sourceSet, 'lightbox'))
    .find((source) => source !== null);

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:type', content: 'article' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'article:published_time', content: post.createdAt },
    ...(image
      ? [
          { property: 'og:image', content: getImageUrl(image.key) },
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
    ...(image
      ? [{ name: 'twitter:image', content: getImageUrl(image.key) }]
      : []),
    // only the author gets a post that isn't published; keep it out of indexes
    ...(post.status === 'Published'
      ? []
      : [{ name: 'robots', content: 'noindex' }]),
  ];
}
