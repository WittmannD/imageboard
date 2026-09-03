import { Logo } from 'src/components/ui/logo/Logo.tsx';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from 'src/components/ui/navigation-menu/NavigationMenu.tsx';
import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { ThemeToggle } from 'src/components/features/theme/ThemeToggle.tsx';

function Header() {
  return (
    <header className="flex items-center justify-between container mx-auto px-4 h-[var(--header-height)]">
      <Link to="/">
        <Logo width={185} height={35} className="dark:text-white" />
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink render={<Link to="auth/login" />}>
              Log In
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className="flex-row items-center gap-1"
              render={<Link to="?modal=create-post" mask="posts/create" />}
            >
              <Plus />
              Post
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <ThemeToggle variant="ghost" size="icon-lg" />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}

export { Header}