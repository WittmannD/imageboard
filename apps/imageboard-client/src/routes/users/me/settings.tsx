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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from 'src/components/ui/item/Item.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import {
  BadgeCheckIcon,
  SquareAsteriskIcon,
  TriangleAlertIcon,
  UploadIcon,
  UserIcon,
} from 'lucide-react';
import { useAuth } from 'src/components/features/auth/context.tsx';
import { useGetMeQuery } from 'src/services/api/user/api.ts';
import { getImageByVariant, getImageUrl } from 'src/lib/utils/image-source.ts';
import type { AvatarSource } from 'src/services/api/types.ts';
import { Link } from 'react-router';
import { useDialogManager } from 'src/lib/dialog-manager/context.tsx';

function AccountSettingsPage() {
  const auth = useAuth(true);
  const { getDialogSearchParams } = useDialogManager();

  const { data: user } = useGetMeQuery();

  if (!user) {
    return null;
  }

  const avatar = getImageByVariant<AvatarSource>(user.avatars, 'icon_large');

  return (
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
            <div className="grow w-0">
              <Button
                variant="secondary"
                size="sm"
                render={<Link to={{ search: getDialogSearchParams('avatar-upload')  }} />}
              >
                <UploadIcon />
                Upload Avatar
              </Button>
            </div>
          </div>
        </CardTitle>
        <CardContent className="px-0 pt-4">
          <ItemGroup>
            <Item variant="outline" size="xs">
              <ItemMedia>
                <UserIcon className="size-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  <span>@{user.username}</span>
                </ItemTitle>
                <ItemDescription>
                  This is your public display name.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </ItemActions>
            </Item>
            {auth.user.emailVerified ? (
              <Item variant="outline" size="xs">
                <ItemMedia>
                  <BadgeCheckIcon className="size-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    <span>{user.email}</span>
                  </ItemTitle>

                  <ItemDescription>
                    Your email has been verified.
                  </ItemDescription>
                </ItemContent>
              </Item>
            ) : (
              <Item variant="outline" size="xs">
                <ItemMedia>
                  <TriangleAlertIcon className="size-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    <span>{user.email}</span>
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
            )}
            <Item variant="outline" size="xs">
              <ItemMedia>
                <SquareAsteriskIcon className="size-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Password</ItemTitle>
              </ItemContent>
              <ItemActions>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </ItemActions>
            </Item>
          </ItemGroup>
        </CardContent>
      </CardHeader>
    </Card>
  );
}

export default AccountSettingsPage;
