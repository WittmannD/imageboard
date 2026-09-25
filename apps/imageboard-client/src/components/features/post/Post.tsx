import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card/Card.tsx';
import type {
  LayoutTile,
  PhotoSource,
  PostDto,
} from 'src/services/api/types.ts';
import React from 'react';
import { Link } from 'react-router';
import { useDialogManager } from 'src/lib/dialog-manager/context.tsx';
import { getImageByVariant, getImageUrl } from 'src/lib/utils/image-source.ts';
import {
  UserAvatar,
  UserBadge,
  UserTag,
} from 'src/components/features/user/UserBadge.tsx';
import LikeButton from '../like-button/LikeButton';

const getImageCellStyle = (tile: LayoutTile): React.CSSProperties => ({
  gridColumn: `${tile.column.toString()} / span ${tile.columnSpan.toString()}`,
  gridRow: `${tile.row.toString()} / span ${tile.rowSpan.toString()}`,
});

function PostGalleryTiles({ post }: { post: PostDto }) {
  const { getDialogSearchParams } = useDialogManager();

  return post.photos.map((photo) => {
    const tile = getImageByVariant<PhotoSource>(photo.sourceSet, 'tile');
    if (!tile || tile.metadata?.variant !== 'tile') return null;
    return (
      <Link
        key={photo.id}
        className="block outline-none"
        to={{
          search: getDialogSearchParams('post', {
            id: post.id,
            photoId: photo.id,
          }),
        }}
        mask={{ pathname: `/posts/${post.id}`, search: `?photoId=${photo.id}` }}
        style={getImageCellStyle(tile.metadata.tile)}
      >
        <img
          key={photo.id}
          src={getImageUrl(tile.key)}
          width={tile.width}
          height={tile.height}
          alt=""
          className="block bg-muted/50"
        />
      </Link>
    );
  });
}

function Post({ data: post }: { data: PostDto }) {
  const hasPhotos = post.photos.length > 0;

  return (
    <Card size="sm">
      {hasPhotos && (
        <div
          className="grid auto-cols-max auto-rows-max gap-1.5"
          data-slot="card-image"
        >
          <PostGalleryTiles post={post} />
        </div>
      )}
      <CardHeader>
        <CardTitle>
          <UserBadge
            user={post.user}
            render={<Link to={`/users/${post.user.id}`} />}
          >
            <UserAvatar size="sm" />
            <UserTag />
          </UserBadge>
        </CardTitle>
        <CardAction>
          <LikeButton post={post} />
        </CardAction>
        {post.caption && (
          <CardDescription className="line-clamp-2">
            {post.caption}
          </CardDescription>
        )}
      </CardHeader>
    </Card>
  );
}

export { Post };
