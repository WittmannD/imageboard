import React, { useCallback, useState } from 'react';
import { HeartIcon } from 'lucide-react';
import {
  useLikePostMutation,
  useUnlikePostMutation,
} from 'src/services/api/post/api.ts';
import type { PostDto } from 'src/services/api/types.ts';
import { useAuth } from 'src/components/features/auth/context.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import { cn } from 'src/lib/utils/cn.ts';
import useNumberFormatter from 'src/hooks/useNumberFormatter.ts';

function LikeButton({
  post,
  className,
  ...props
}: { post: PostDto } & React.ComponentProps<typeof Button>) {
  const [likePost] = useLikePostMutation();
  const [unlikePost] = useUnlikePostMutation();
  const { isLoggedIn } = useAuth();
  const [animate, setAnimate] = useState(false);
  const formatter = useNumberFormatter({
    notation: 'compact',
    compactDisplay: 'short',
  });

  const onLikeClick = useCallback(() => {
    if (!isLoggedIn) {
      return;
    }
    if (post.likedByMe) {
      setAnimate(false);
      unlikePost(post.id).unwrap().catch();
    } else {
      setAnimate(true);
      likePost(post.id).unwrap().catch();
    }
  }, [likePost, unlikePost, setAnimate, post.id, post.likedByMe, isLoggedIn]);

  return (
    <Button
      variant="ghost"
      size="lg"
      {...props}
      className={cn(className)}
      onClick={onLikeClick}
      disabled={!isLoggedIn}
    >
      <span className="relative size-5" data-icon="inline-start">
        {post.likedByMe && animate && (
          <HeartIcon
            className="
              absolute inset-0 size-5
              fill-red-500 stroke-red-500
              animate-like-ping
            "
            onAnimationEnd={() => setAnimate(false)}
          />
        )}
        <HeartIcon
          className={cn(
            'absolute inset-0 size-5 transition-colors duration-150',
            post.likedByMe
              ? 'fill-red-500 stroke-red-500'
              : 'fill-none stroke-slate-500',
            post.likedByMe && animate && 'animate-like-pop',
          )}
        />
      </span>
      <span className="tabular-nums leading-none">
        {formatter.format(post.likesCount)}
      </span>
    </Button>
  );
}

export default LikeButton;
