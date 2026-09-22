import {
  SettingsIcon,
  UserIcon,
  LogOutIcon,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu/DropdownMenu.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import { useAuth } from 'src/components/features/auth/context.tsx';
import { useGetMeQuery } from 'src/services/api/user/api.ts';
import { UserAvatar } from 'src/components/features/user/UserAvatar.tsx';
import { Form, Link } from 'react-router';

export function UserMenu() {
  const { isLoggedIn } = useAuth(false);
  const { data: user } = useGetMeQuery(undefined, { skip: !isLoggedIn });

  if (!isLoggedIn || !user) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="lg" data-testid="header-user-menu-trigger">
            <UserAvatar user={user} size="sm" />
            <span>@{user.username}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <Form method="post" id="logout" action="/auth/logout" className="size-0"></Form>
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to="/users/me" />}>
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link to="/users/me/settings" />}>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          render={
            <button
              type="submit"
              form="logout"
              className="w-full"
              data-testid="header-menu-logout"
            />
          }
        >
          <LogOutIcon />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
