export type PhotoStatus = 'Pending' | 'Processing' | 'Ready' | 'Failed';
export type PostStatus = 'Draft' | 'Published' | 'Unpublished';

export interface LayoutTile {
  key: string;
  width: number;
  height: number;
  column: number;
  fit: 'cover' | 'contain';
  row: number;
  columnSpan: number;
  rowSpan: number;
}

export interface VariantMetadata {
  variant: string;
}

export interface AvatarMetadata extends VariantMetadata {
  variant: 'avatar' | 'icon_small' | 'icon_medium' | 'icon_large';
}

export interface GalleryPhotoMetadata extends VariantMetadata {
  tile: LayoutTile;
  variant: 'tile';
}

export interface LightboxPhotoMetadata extends VariantMetadata {
  variant: 'lightbox';
}

export interface ImageSource {
  key: string;
  mimetype: string;
  size: number;
  width: number;
  height: number;
  metadata?: VariantMetadata;
}

export interface PhotoSource extends ImageSource {
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

export interface PhotoDto extends PhotoDraftDto {
  sourceSet: PhotoSource[];
}

export interface PostDraftDto {
  id: number;
  caption: string | null;
  status: PostStatus;
  likesCount: number;
  user: UserDto;
  photos: PhotoDraftDto[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PostDto extends PostDraftDto {
  photos: PhotoDto[];
  // false for anonymous viewers
  likedByMe: boolean;
}

export interface LikeStatusDto {
  postId: number;
  likesCount: number;
  likedByMe: boolean;
}

export interface PageQuery {
  cursor?: string;
  order?: 'ASC' | 'DESC';
  limit?: number;
}

export type GetPostsQuery = Omit<PageQuery, 'cursor'>

export interface GetPostsResponse {
  nextCursor: string | null;
  hasNextPage: boolean;
  items: PostDto[];
}

// a user's feed; statuses other than Published are served only to the author
export interface GetUserPostsQuery extends Omit<PageQuery, 'cursor'> {
  userId: number;
  status?: PostStatus;
}

// Unpublished deletes the post, Published restores it
export interface UpdatePostStatusBody {
  id: number;
  status: Extract<PostStatus, 'Published' | 'Unpublished'>;
}

export type PostWithAuthorDto = Omit<PostDto, 'likedByMe'>;

export interface CreatePostBody {
  caption?: string;
  files: File[];
}

// users

export interface AvatarSource extends ImageSource {
  metadata?: AvatarMetadata;
}

export interface UserDto {
  id: number;
  username: string;
  avatars: AvatarSource[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileDto extends UserDto {
  email: string;
}

export interface UserStatsDto {
  userId: number;
  postsCount: number;
  likesReceived: number;
}
