import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from 'src/components/ui/navigation-menu/NavigationMenu.tsx';
import { navigationMenuTriggerStyle } from 'src/components/ui/navigation-menu/navigation-menu-style.ts';
import { Link, Outlet, useLocation } from 'react-router';
import { SettingsIcon, UserIcon } from 'lucide-react';

function MyProfileLayout() {
  const location = useLocation();

  return (
    <div className="py-8">
      <NavigationMenu className="mx-auto w-full max-w-md mb-4">
        <NavigationMenuList className="gap-2">
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle({
                className: 'flex-row items-center gap-1',
              })}
              active={location.pathname === '/users/me'}
              render={<Link to="/users/me" />}
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
              active={location.pathname === '/users/me/settings'}
              render={<Link to="/users/me/settings" />}
            >
              <SettingsIcon />
              Settings
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem className="ml-auto">
            <NavigationMenuLink
              className={navigationMenuTriggerStyle({
                className: 'auto flex-row items-center gap-1',
                variant: 'destructive',
              })}
              render={<Link to="/users/me/settings" />}
            >
              Log Out
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Outlet />
    </div>
  );
}

export default MyProfileLayout;
