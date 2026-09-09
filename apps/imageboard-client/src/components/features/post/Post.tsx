import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card/Card.tsx';
import type { LayoutTile, PhotoDto, PostDto } from 'src/services/api/types.ts';
import React from 'react';
import { Link } from 'react-router';
import { useDialogManager } from 'src/lib/dialog-manager/context.tsx';

const getTileImage = (photo: PhotoDto) => {
  return photo.sourceSet.find((source) => source.metadata?.variant === 'tile')
};

const getImageCellStyle = (tile: LayoutTile): React.CSSProperties => ({
  gridColumn: `${tile.column.toString()} / span ${tile.columnSpan.toString()}`,
  gridRow: `${tile.row.toString()} / span ${tile.rowSpan.toString()}`,
});

function Post(props: { data: PostDto }) {
  const hasPhotos = props.data.photos.length > 0 && props.data.photos[0].sourceSet.length > 0;
  const { getDialogSearchParams } = useDialogManager();

  return (
    <>
      <Card size="sm">
        {hasPhotos && (
          <div
            className="grid auto-cols-max auto-rows-max gap-1.5"
            data-slot="card-image"
          >
            {props.data.photos.map((photo) => {
              const image = getTileImage(photo);
              if (!image || image.metadata?.variant !== 'tile') return null;
              return (
                <Link
                  key={photo.id}
                  className="block outline-none"
                  to={{ search: getDialogSearchParams('post', { id: props.data.id, photoId: photo.id }) }}
                  mask={{ pathname: `posts/${props.data.id}`, search: `?photoId=${photo.id}` }}
                  style={getImageCellStyle(image.metadata.tile)}
                >
                  <img
                    key={photo.id}
                    src={`${import.meta.env['VITE_IMAGE_SERVER_URL']}/${image.key}`}
                    width={image.width}
                    height={image.height}
                    alt=""
                    className="block bg-muted/50"
                  />
                </Link>
              );
            })}
          </div>
        )}
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardAction>Card Action</CardAction>
          <CardDescription>{props.data.user.username}</CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}

export { Post }