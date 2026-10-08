export enum MediaType {
  Image = 'Image',
  Video = 'Video',
}

/** The kind of an upload, by the mime type the upload pipe accepted. */
export function mediaTypeOf(mimetype: string): MediaType {
  return mimetype.startsWith('video/') ? MediaType.Video : MediaType.Image;
}
