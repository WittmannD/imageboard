export const IMAGE_UPLOADED = 'image_uploaded';

export interface ImageUploadedEventData {
  path: string;
  mimetype: string;
}
