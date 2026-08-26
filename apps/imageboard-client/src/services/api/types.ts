export type PhotoStatus = 'Pending' | 'Processing' | 'Ready' | 'Failed';
export type PostStatus = 'Draft' | 'Published';

export interface LayoutTile {
  key: string;
  width: number;
  height: number;
  column: number;
  row: number;
  columnSpan: number;
  rowSpan: number;
}

export interface GalleryPhotoMetadata {
  tile: LayoutTile;
  variant: 'tile';
}

export interface LightboxPhotoMetadata {
  variant: 'lightbox';
}

export interface PhotoSource {
  key: string;
  mimetype: string;
  size: number;
  width: number;
  height: number;
  metadata?: GalleryPhotoMetadata | LightboxPhotoMetadata;
}

export interface PhotoDraftDto {
  id: number;
  uploadUuid: string;
  key?: string;
  status: PhotoStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type PhotoDto = PhotoDraftDto & {
  sourceSet: PhotoSource[];
};

export interface PostDraftDto {
  id: number;
  caption: string | null;
  status: PostStatus;
  photos: PhotoDraftDto[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type PostDto = {
  photos: PhotoDto[];
} & PostDraftDto;

export interface GetPostsQuery {
  cursor?: string;
  order?: 'ASC' | 'DESC';
  limit?: number;
}

export interface GetPostsResponse {
  nextCursor: string | null;
  hasNextPage: boolean;
  items: PostDto[];
}

export interface CreatePostBody {
  caption?: string;
  files: File[];
}

