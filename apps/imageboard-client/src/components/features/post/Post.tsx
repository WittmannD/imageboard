import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card/Card.tsx';
import type { LayoutTile, PhotoDto, PostDto } from 'src/services/api/types.ts';
import React from 'react';
import { Link } from 'react-router';

const getTileImage = (photo: PhotoDto) => {
  return photo.sourceSet.find((source) => source.metadata?.variant === 'tile')
};

const getImageCellStyle = (tile: LayoutTile): React.CSSProperties => ({
  gridColumn: `${tile.column.toString()} / span ${tile.columnSpan.toString()}`,
  gridRow: `${tile.row.toString()} / span ${tile.rowSpan.toString()}`,
});

function Post(props: { data: PostDto }) {
  const hasPhotos = props.data.photos.length > 0 && props.data.photos[0].sourceSet.length > 0;

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
                    to={`?post=${props.data.id}`}
                    className="block outline-none"
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
          <CardDescription>Card Description</CardDescription>
          <CardAction>Card Action</CardAction>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>
    </>
  );
}

export { Post }