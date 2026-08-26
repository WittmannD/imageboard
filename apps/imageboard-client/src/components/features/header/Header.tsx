import { Logo } from 'src/components/ui/logo/Logo.tsx';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from 'src/components/ui/navigation-menu/NavigationMenu.tsx';
import { Moon, Plus, Sun } from 'lucide-react';
import { selectIsDarkTheme, toggleTheme } from 'src/services/store/theme-reducer.ts';
import { useAppDispatch, useAppSelector } from 'src/hooks/useAppState.ts';
import { CreatePostDialog } from 'src/components/features/dialogs/CreatePostDialog.tsx';
import { useDialog } from 'src/lib/dialog/hooks/useDialog.ts';
import { Link } from 'react-router';

function Header() {
  const isDarkTheme = useAppSelector(selectIsDarkTheme);
  const dispatch = useAppDispatch();
  const createPostDialog = useDialog(CreatePostDialog);

  return (
    <header className="flex items-center justify-between container mx-auto px-4">
      <Link to="/">
        <Logo width={185} height={35} className="dark:text-white" />
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink render={<Link to="auth/login"/>}>
              Log In
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className="flex-row items-center gap-1"
              onClick={() => createPostDialog.show()}
            >
              <Plus />
              Post
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink onClick={() => dispatch(toggleTheme())}>
              {isDarkTheme ? <Sun /> : <Moon />}
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}

export { Header}