import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card/Card.tsx';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from 'src/components/ui/avatar/Avatar.tsx';
import { cn } from 'src/lib/utils/cn.ts';
import { Post } from 'src/components/features/post/Post.tsx';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from 'src/components/ui/item/Item.tsx';
import { TriangleAlertIcon } from 'lucide-react';
import { Button } from 'src/components/ui/button/Button.tsx';
import { getImageByVariant, getImageUrl } from 'src/lib/utils/image-source.ts';
import type {
  AvatarSource,
  ProfileDto,
  UserDto,
} from 'src/services/api/types.ts';

const data = [
  {
    name: 'Posts',
    value: '18',
  },
  {
    name: 'Likes',
    value: '532',
  },
];

function Stats() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-full grid grid-cols-1 gap-1 rounded-xl sm:grid-cols-2">
        {data.map((stat, index) => (
          <Card
            className={cn(
              'rounded-none border-0 py-0 shadow-none',
              index === 0 && 'rounded-l-xl',
              index === data.length - 1 && 'rounded-r-xl',
            )}
            key={stat.name}
          >
            <CardContent className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 p-4 sm:p-6">
              <div className="font-medium text-muted-foreground text-sm">
                {stat.name}
              </div>
              <div className="w-full flex-none font-medium text-3xl text-foreground tabular-nums tracking-tight">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export interface ProfileViewProps {
  user: UserDto | ProfileDto;
  /** Email to prompt verification for, shown instead of the stats row. Omit when there's nothing to verify. */
  unverifiedEmail?: string;
}

export function ProfileView({ user, unverifiedEmail }: ProfileViewProps) {
  const avatar = getImageByVariant<AvatarSource>(user.avatars, 'icon_large');

  return (
    <div>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Avatar size="lg">
                {avatar && (
                  <AvatarImage
                    src={getImageUrl(avatar.key)}
                    alt={user.username}
                  />
                )}
                <AvatarFallback>{user.username.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span
                className="grow w-0 truncate text-ellipsis"
                data-testid="profile-username"
              >
                @{user.username}
              </span>
            </div>
          </CardTitle>
          <CardContent className="px-0 pt-4">
            {unverifiedEmail ? (
              <Item variant="outline" size="xs">
                <ItemMedia>
                  <TriangleAlertIcon className="size-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    <span>{unverifiedEmail}</span>
                  </ItemTitle>
                  <ItemDescription>
                    To start posting, you need to verify your email address.
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button variant="outline" size="sm">
                    Verify
                  </Button>
                </ItemActions>
              </Item>
            ) : (
              <Stats />
            )}
          </CardContent>
        </CardHeader>
      </Card>
      <div className="mt-8 mx-auto w-full max-w-lg">
        <h1 className="typeset text-xl mb-4">Recent Posts</h1>
        <Post
          data={{
            caption: '',
            status: 'Published',
            id: 1,
            createdAt: '2026-09-13T13:14:23.434Z',
            updatedAt: '2026-09-13T13:14:23.483Z',
            deletedAt: null,
            photos: [
              {
                sourceSet: [
                  {
                    key: 'e9f2e8f7-a356-472c-901b-e05d45f66568_lightbox.jpeg',
                    size: 105632,
                    width: 736,
                    mimetype: 'jpeg',
                    height: 969,
                    metadata: {
                      variant: 'lightbox',
                    },
                  },
                  {
                    key: 'e9f2e8f7-a356-472c-901b-e05d45f66568_tile.jpeg',
                    size: 69993,
                    width: 544,
                    mimetype: 'jpeg',
                    height: 716,
                    metadata: {
                      tile: {
                        key: 'e9f2e8f7-a356-472c-901b-e05d45f66568',
                        row: 1,
                        width: 544,
                        column: 1,
                        height: 716,
                        rowSpan: 1,
                        columnSpan: 1,
                      },
                      variant: 'tile',
                    },
                  },
                ],
                status: 'Ready',
                id: 1,
                createdAt: '2026-09-13T13:14:23.434Z',
                updatedAt: '2026-09-13T13:14:23.483Z',
                deletedAt: null,
                uploadUuid: 'e9f2e8f7-a356-472c-901b-e05d45f66568',
                key: '',
              },
            ],
            user: {
              id: 1,
              createdAt: '2026-09-13T13:14:23.318Z',
              updatedAt: '2026-09-13T13:14:23.318Z',
              username: '@Akame',
              avatars: [],
            },
          }}
        />
      </div>
    </div>
  );
}
