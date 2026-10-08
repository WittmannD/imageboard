export type MediaStatus = 'Pending' | 'Processing' | 'Ready' | 'Failed';
export type MediaType = 'Image' | 'Video';
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

// an image's tile, or the still of a video's tile until the gallery plays videos
export interface GalleryMediaMetadata extends VariantMetadata {
  tile: LayoutTile;
  variant: 'tile' | 'tilePoster';
}

// an image's lightbox size, or a video's poster
export interface LightboxMediaMetadata extends VariantMetadata {
  variant: 'lightbox' | 'poster';
}

export interface ImageSource {
  key: string;
  mimetype: string;
  size: number;
  width: number;
  height: number;
  metadata?: VariantMetadata;
}

export interface MediaSource extends ImageSource {
  metadata?: GalleryMediaMetadata | LightboxMediaMetadata;
}

export interface MediaDraftDto {
  id: number;
  uploadUuid: string;
  key?: string;
  type: MediaType;
  status: MediaStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface MediaDto extends MediaDraftDto {
  sourceSet: MediaSource[];
}

export interface PostDraftDto {
  id: number;
  caption: string | null;
  status: PostStatus;
  likesCount: number;
  user: UserDto;
  media: MediaDraftDto[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PostDto extends PostDraftDto {
  media: MediaDto[];
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

export type GetPostsQuery = Omit<PageQuery, 'cursor'>;

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
