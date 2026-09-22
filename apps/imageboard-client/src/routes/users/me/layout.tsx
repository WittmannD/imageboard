import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from 'src/components/ui/navigation-menu/NavigationMenu.tsx';
import { navigationMenuTriggerStyle } from 'src/components/ui/navigation-menu/navigation-menu-style.ts';
import { Form, NavLink, Outlet } from 'react-router';
import { SettingsIcon, UserIcon } from 'lucide-react';
import { useAuth } from 'src/components/features/auth/context.tsx';

function MyProfileLayout() {
  const { isLoggedIn } = useAuth(true);

  return (
    <div className="py-8">
      <NavigationMenu className="mx-auto w-full max-w-md mb-4">
        <NavigationMenuList className="gap-2">
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle({
                className: 'flex-row items-center gap-1',
              })}
              render={<NavLink to="/users/me" end />}
            >
              <UserIcon />
              Profile
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle({
                className: 'flex-row items-center gap-1',
              })}
              render={<NavLink to="/users/me/settings" end />}
            >
              <SettingsIcon />
              Settings
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem className="ml-auto">
            { isLoggedIn &&
              <Form method="post" action="/auth/logout">
                <NavigationMenuLink
                  className={navigationMenuTriggerStyle({
                    className: 'auto flex-row items-center gap-1',
                    variant: 'destructive',
                  })}
                  render={<button type="submit" data-testid="profile-logout" />}
                >
                  Log Out
                </NavigationMenuLink>
              </Form>
            }
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Outlet />
    </div>
  );
}

export default MyProfileLayout;
