import type { ImageSource } from 'src/services/api/types.ts';

export function getImageByVariant<T extends ImageSource = ImageSource>(
  sources: ImageSource[],
  variant: NonNullable<T['metadata']>['variant'],
): T | null {
  return (sources.find((source) => source.metadata?.variant === variant) ??
    null) as T | null;
}

export function getImageUrl(key: string) {
  return `${import.meta.env['VITE_IMAGE_SERVER_URL']}/${key}`;
}
