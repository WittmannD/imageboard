import { config } from 'src/.server/config.ts';
import type { PostDto } from 'src/services/api/types.ts';

const apiUrl = new URL(config.urls.api);

export type FetchPostResult =
  | { status: 'ok'; post: PostDto }
  // missing, or not published and the viewer isn't the author
  | { status: 'not-found' }
  // couldn't prefetch (API down, unexpected error); the client fetches it
  | { status: 'unavailable' };

async function requestPost(id: number, accessToken?: string) {
  const headers = new Headers({ Accept: 'application/json' });

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return await fetch(new URL(`/posts/${id}`, apiUrl), { headers });
}

/**
 * Fetches a post for server rendering. Token refresh is left to the /api
 * proxy the client goes through: on an expired token this retries
 * anonymously, which still gets a published post.
 */
export async function fetchPost(
  id: number,
  accessToken?: string,
): Promise<FetchPostResult> {
  try {
    let response = await requestPost(id, accessToken);
    const retriedAnonymously = response.status === 401 && !!accessToken;

    if (retriedAnonymously) {
      await response.body?.cancel();
      response = await requestPost(id);
    }

    if (response.ok) {
      return { status: 'ok', post: (await response.json()) as PostDto };
    }

    await response.body?.cancel();

    if (response.status === 404) {
      return { status: 'not-found' };
    }

    // a 403 is someone else's unpublished post: to the viewer it doesn't
    // exist. Unless the token had expired: the viewer may be the author, so
    // leave it to the client, whose requests refresh the token
    if (response.status === 403 && !retriedAnonymously) {
      return { status: 'not-found' };
    }
  } catch {
    // fall through: the page still renders and the client query retries
  }

  return { status: 'unavailable' };
}
