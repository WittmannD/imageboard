export const POST_TAG_TYPE = 'Posts' as const;
export const POST_LIST_TAG = 'List' as const;

/** Tag id of one user's post list, so it can be invalidated apart from the feed. */
export const userPostListTag = (userId: number) => `User-${userId}`;
