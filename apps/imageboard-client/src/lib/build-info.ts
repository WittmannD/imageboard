export interface BuildInfo {
  /** The project version, shared by all apps (see bin/nx-release.ts). */
  version: string;
  /** The full commit SHA the bundle was built from; null if unknown. */
  commit: string | null;
}

/** Inlined at build time by vite.config.ts. */
declare const __BUILD_INFO__: BuildInfo;

const REPOSITORY_URL = 'https://github.com/WittmannD/imageboard';

export const buildInfo: BuildInfo = __BUILD_INFO__;

export const shortCommit = buildInfo.commit?.slice(0, 7) ?? null;

export const commitUrl = buildInfo.commit
  ? `${REPOSITORY_URL}/commit/${buildInfo.commit}`
  : null;
