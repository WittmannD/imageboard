/**
 * Pulls the identity provider's machine-readable `errorCode` out of a failed
 * RTK Query mutation (see axiosBaseQuery: the response body ends up in `data`).
 */
export function getApiErrorCode(error: unknown): string | undefined {
  return (error as { data?: { errorCode?: string } } | undefined)?.data
    ?.errorCode;
}
