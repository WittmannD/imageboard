import { useCallback } from 'react';
import type { PostDto } from 'src/services/api/types.ts';
import { useAuth } from 'src/components/features/auth/context.tsx';
import { useGetMeQuery } from 'src/services/api/user/api.ts';
import { useUpdatePostStatusMutation } from 'src/services/api/post/api.ts';
import useCopyToClipboard from 'src/hooks/useCopyToClipboard.ts';
import { toast } from 'src/components/ui/toast/Toast.tsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger } from 'src/components/ui/dropdown-menu/DropdownMenu.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  EllipsisIcon,
  LinkIcon,
} from 'lucide-react';

export function PostActionMenu({ post, onArchive }: { post: PostDto, onArchive?: () => void }) {
  const { isLoggedIn } = useAuth();
  const { data: user } = useGetMeQuery(undefined, { skip: !isLoggedIn });
  const [updateStatus] = useUpdatePostStatusMutation();
  const [copyToClipboard] = useCopyToClipboard();

  const isOwner = isLoggedIn && user?.id === post.user.id;

  const archive = useCallback(async () => {
    try {
      await updateStatus({
        id: post.id,
        status: 'Unpublished',
      }).unwrap();
      toast.add({
        type: 'success',
        title: 'Post archived',
        description: 'It will not be visible to other users.',
      });
      onArchive?.();
    } catch {
      toast.add({
        type: 'error',
        title: 'Failed to archive the post',
      });
    }
  }, [updateStatus, post.id]);

  const unarchive = useCallback(async () => {
    try {
      await updateStatus({
        id: post.id,
        status: 'Published',
      }).unwrap();
      toast.add({
        type: 'success',
        title: 'Post has been restored',
        description: 'Now it will be visible to other users.',
      });
    } catch {
      toast.add({
        type: 'error',
        title: 'Failed to restore the post',
      });
    }
  }, [updateStatus, post.id]);

  const copyPostLink = useCallback(async () => {
    try {
      await copyToClipboard(
        new URL(`/posts/${post.id}`, window.location.origin).toString(),
      );
      toast.add({
        type: 'success',
        title: 'Post link copied to the clipboard!',
      });
    } catch {
      toast.add({
        type: 'error',
        title: 'Failed to copy link to the clipboard',
      });
    }
  }, [copyToClipboard]);

  if (!isOwner && post.status === 'Unpublished') return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon-lg"
            variant="ghost"
            className="text-muted-foreground/50"
          >
            <EllipsisIcon className="size-5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" side="top">
        {post.status === 'Published' && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem nativeButton={true} onClick={copyPostLink}>
                <LinkIcon data-icon="inline-start" />
                Copy link
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {isOwner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    nativeButton={true}
                    variant="destructive"
                    onClick={archive}
                  >
                    <ArchiveIcon data-icon="inline-start" />
                    Archive post
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
          </>
        )}
        {post.status === 'Unpublished' && isOwner && (
          <DropdownMenuGroup>
            <DropdownMenuItem nativeButton={true} onClick={unarchive}>
              <ArchiveRestoreIcon data-icon="inline-start" />
              Restore post
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
