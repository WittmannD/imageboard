import { Logo } from 'src/components/ui/logo/Logo.tsx';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from 'src/components/ui/navigation-menu/NavigationMenu.tsx';
import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { ThemeToggle } from 'src/components/features/theme/ThemeToggle.tsx';
import { navigationMenuTriggerStyle } from 'src/components/ui/navigation-menu/navigation-menu-style.ts';
import { useAuth } from 'src/components/features/auth/context.tsx';
import { useDialogManager } from 'src/lib/dialog-manager/context.tsx';
import { UserMenu } from 'src/components/features/user/UserMenu.tsx';

function Header() {
  const { isLoggedIn } = useAuth(false);
  const { getDialogSearchParams } = useDialogManager();

  return (
    <header className="w-full h-[var(--header-height)] relative overflow-hidden">
      <div className="flex items-center justify-between container mx-auto px-4 h-full relative">
        <Link to="/">
          <Logo width={185} height={35} className="dark:text-white" />
        </Link>
        <NavigationMenu>
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
              {isLoggedIn ? (
                <UserMenu />
              ) : (
                <NavigationMenuLink
                  render={<Link to="auth/login" />}
                  className={navigationMenuTriggerStyle({
                    variant: 'secondary',
                  })}
                >
                  Log In
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle({
                  className: 'flex-row items-center gap-1',
                  variant: 'secondary',
                })}
                render={<Link to={{ search: getDialogSearchParams('create-post') }} mask="/posts/create" />}
              >
                <Plus />
                Post
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <ThemeToggle variant="secondary" size="icon-lg" />
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}

export { Header };
