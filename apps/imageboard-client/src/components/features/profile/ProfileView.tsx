import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card/Card.tsx';
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
import type { ProfileDto, UserDto } from 'src/services/api/types.ts';
import {
  UserAvatar,
  UserBadge,
  UserTag,
} from 'src/components/features/user/UserBadge.tsx';
import { Stats } from '../stats/Stats';

export interface ProfileViewProps {
  user: UserDto | ProfileDto;
  /** Email to prompt verification for, shown instead of the stats row. Omit when there's nothing to verify. */
  unverifiedEmail?: string;
}

export function ProfileView({ user, unverifiedEmail }: ProfileViewProps) {
  return (
    <div>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <UserBadge user={user}>
                <UserAvatar size="lg" />
                <UserTag data-testid="profile-username" />
              </UserBadge>
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
              <Stats userId={user.id} />
            )}
          </CardContent>
        </CardHeader>
      </Card>
      <div className="mt-8 mx-auto w-full max-w-lg">
        <h1 className="typeset text-xl mb-4">Recent Posts</h1>
      </div>
    </div>
  );
}
