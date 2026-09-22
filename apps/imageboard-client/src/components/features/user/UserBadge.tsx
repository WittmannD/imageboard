import { useRender } from '@base-ui/react/use-render';
import type { AvatarSource, UserDto } from 'src/services/api/types.ts';
import { cn } from 'src/lib/utils/cn.ts';
import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from 'src/components/ui/avatar/Avatar.tsx';
import { getImageByVariant, getImageUrl } from 'src/lib/utils/image-source.ts';

type UserBadgeContextProps = {
  user: UserDto;
};

const UserBadgeContext = React.createContext<UserBadgeContextProps | null>(
  null,
);

const avatarSizeMap: Record<
  NonNullable<React.ComponentProps<typeof Avatar>['size']>,
  NonNullable<AvatarSource['metadata']>['variant']
> = {
  sm: 'icon_small',
  default: 'icon_medium',
  lg: 'icon_large',
};

function useUserBadge(options?: { skip: boolean }) {
  const skip = options?.skip ?? false;

  if (skip) {
    return { user: null };
  }

  const context = React.useContext(UserBadgeContext);
  if (!context) {
    throw new Error('useUserBadge must be used within a UserBadgeProvider');
  }
  return context;
}

export function UserTag({
  user,
  render,
  ...props
}: {
  user?: UserDto | null;
  className?: string;
} & useRender.ComponentProps<'span'>) {
  const { user: contextUser } = useUserBadge({ skip: Boolean(user) });
  user = user ?? contextUser;

  if (!user) {
    return null;
  }

  return useRender({
    defaultTagName: 'span',
    render,
    props: {
      ...props,
      children: `@${user.username}`,
    },
  });
}

export function UserAvatar({
  user,
  size = 'default',
  ...props
}: React.ComponentProps<typeof Avatar> & { user?: UserDto | null }) {
  const { user: contextUser } = useUserBadge({ skip: Boolean(user) });
  user = user ?? contextUser;

  if (!user) {
    return null;
  }

  const avatar = useMemo(() => getImageByVariant<AvatarSource>(
    user.avatars,
    avatarSizeMap[size] || 'icon_medium',
  ), [user.avatars, size]);

  return (
    <Avatar size={size} {...props}>
      {avatar && (
        <AvatarImage src={getImageUrl(avatar.key)} alt={user.username} />
      )}
      <AvatarFallback>{user.username.slice(0, 2)}</AvatarFallback>
    </Avatar>
  );
}

export function UserBadge({
  children,
  className,
  user,
  render,
  ...props
}: {
  user: UserDto;
  className?: string;
} & useRender.ComponentProps<'div'>) {
  const element = useRender({
    defaultTagName: 'div',
    render,
    props: {
      ...props,
      className: cn(
        'inline-flex items-center has-data-[slot=avatar]:gap-1',
        className,
      ),
      children,
    },
  });

  return (
    <UserBadgeContext.Provider value={{ user }}>
      {element}
    </UserBadgeContext.Provider>
  );
}
