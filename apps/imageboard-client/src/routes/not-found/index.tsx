import { SearchXIcon } from 'lucide-react';
import { data, Link, type LoaderFunction } from 'react-router';
import { Button } from 'src/components/ui/button/Button.tsx';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card/Card.tsx';

export const loader: LoaderFunction = () => {
  return data(null, { status: 404 });
};

function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100svh-var(--header-height))] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="items-center text-center">
            <SearchXIcon className="text-muted-foreground size-8" />
            <CardTitle>Page not found</CardTitle>
            <CardDescription>
              The page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/">
              <Button className="w-full" data-testid="not-found-return-home">
                Return home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default NotFoundPage;
