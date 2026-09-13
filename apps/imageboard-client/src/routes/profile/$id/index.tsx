import { Card, CardHeader, CardTitle } from 'src/components/ui/card/Card.tsx';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from 'src/components/ui/avatar/Avatar.tsx';

function ProfilePage() {
  return (
    <div className="py-8">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Avatar size="lg">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CNN</AvatarFallback>
              </Avatar>
              <span className="grow w-0 truncate text-ellipsis">Akame</span>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

export default ProfilePage;
