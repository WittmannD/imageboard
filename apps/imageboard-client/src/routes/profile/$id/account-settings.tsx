import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card/Card.tsx';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from 'src/components/ui/avatar/Avatar.tsx';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from 'src/components/ui/item/Item.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import {
  BadgeCheckIcon,
  SquareAsteriskIcon,
  TriangleAlertIcon,
} from 'lucide-react';

function AccountSettingsPage() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Avatar size="lg">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CNN</AvatarFallback>
            </Avatar>
            <span className="grow w-0 truncate text-ellipsis">@Akame</span>
          </div>
        </CardTitle>
        <CardContent className="px-0 pt-4">
          <ItemGroup>
            <Item variant="outline" size="xs">
              <ItemMedia>
                <TriangleAlertIcon className="size-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  Email: <span className="font-mono">akamegakiru@gmail.com</span>
                </ItemTitle>
                <ItemDescription>
                  To start posting, you need to verify your email address.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="outline" size="sm">
                  Verify
                </Button>
              </ItemActions>
            </Item>
            <Item variant="outline" size="xs">
              <ItemMedia>
                <BadgeCheckIcon className="size-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  Email: <span className="font-mono">akamegakiru@gmail.com</span>
                </ItemTitle>

                <ItemDescription>Your email has been verified.</ItemDescription>
              </ItemContent>
            </Item>
            <Item variant="outline" size="xs">
              <ItemMedia>
                <SquareAsteriskIcon className="size-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Password</ItemTitle>
              </ItemContent>
              <ItemActions>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </ItemActions>
            </Item>
          </ItemGroup>
        </CardContent>
      </CardHeader>
    </Card>
  );
}

export default AccountSettingsPage;
