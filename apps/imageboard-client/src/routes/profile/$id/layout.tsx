import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from 'src/components/ui/navigation-menu/NavigationMenu.tsx';
import { navigationMenuTriggerStyle } from 'src/components/ui/navigation-menu/navigation-menu-style.ts';
import { Link, Outlet } from 'react-router';
import { Plus } from 'lucide-react';

function ProfileLayout() {
  return (
    <div className="py-8">
      <NavigationMenu className="mx-auto w-full max-w-md mb-4">
        <NavigationMenuList className="gap-2">
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle({
                className: 'flex-row items-center gap-1',
              })}
              active={true}
              render={<Link to="/profile/1" />}
            >
              <Plus />
              Profile
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle({
                className: 'flex-row items-center gap-1',
              })}
              render={<Link to="/profile/1/account-settings" />}
            >
              <Plus />
              Account
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem className="ml-auto">
            <NavigationMenuLink
              className={navigationMenuTriggerStyle({
                className: 'auto flex-row items-center gap-1',
                variant: 'destructive',
              })}
              render={<Link to="/profile/1/account-settings" />}
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

export default ProfileLayout;