import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from 'src/components/ui/avatar/Avatar.tsx';
import { getImageByVariant, getImageUrl } from 'src/lib/utils/image-source.ts';
import React from 'react';
import type { AvatarSource, UserDto } from 'src/services/api/types.ts';

const avatarSizeMap: Record<
  NonNullable<React.ComponentProps<typeof Avatar>['size']>,
  NonNullable<AvatarSource['metadata']>['variant']
> = {
  sm: 'icon_small',
  default: 'icon_medium',
  lg: 'icon_large',
};

export function UserAvatar({
  user,
  size = 'default',
  ...props
}: React.ComponentProps<typeof Avatar> & { user: UserDto }) {
  const avatar = getImageByVariant<AvatarSource>(
    user.avatars,
    avatarSizeMap[size] || 'icon_medium',
  );

  return (
    <Avatar size={size} {...props}>
      {avatar && (
        <AvatarImage src={getImageUrl(avatar.key)} alt={user.username} />
      )}
      <AvatarFallback>{user.username.slice(0, 2)}</AvatarFallback>
    </Avatar>
  );
}
