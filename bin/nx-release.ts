import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { ReleaseClient } from 'nx/release/index.js';

// Every deployed app shares one version: they always ship together, so a
// single number (tagged v{version}) says what is running. The apps are private
// and deployed as images, so nothing is published to a registry.
const release = new ReleaseClient({
  projects: ['apps/*', '!imageboard-e2e'],
  projectsRelationship: 'fixed',
  releaseTagPatternCheckAllBranchesWhen: false,
  version: {
    conventionalCommits: true,
  },
  conventionalCommits: {
    types: {
      // this repo writes `feature:` rather than the standard `feat:`
      feature: {
        semverBump: 'minor',
        changelog: { title: '🚀 Features' },
      },
    },
  },
  changelog: {
    automaticFromRef: true,
    projectChangelogs: false,
    workspaceChangelog: {
      file: '{workspaceRoot}/CHANGELOG.md',
      createRelease: 'github',
      renderOptions: {
        authors: false,
        commitReferences: true,
        versionTitleDate: true,
        applyUsernameToAuthors: true,
      },
    },
  },
});

// `npm run release -- --dry-run` previews the version and changelog without
// writing, committing or pushing anything
const dryRun = process.argv.includes('--dry-run');
// Before the first v* tag there is nothing to diff against: nx then starts
// from the version in package.json and the first commit
const firstRelease =
  execSync('git tag --list "v*"', { encoding: 'utf8' }).trim() === '';

const { workspaceVersion, projectsVersionData } = await release.releaseVersion({
  dryRun,
  verbose: true,
  // committed and tagged together with the changelog below
  gitCommit: false,
  gitTag: false,
  firstRelease,
});

// no releasable commits (only chore, docs, ...) since the last tag
if (!workspaceVersion) {
  console.log('Nothing to release.');
  process.exit(0);
}

await release.releaseChangelog({
  dryRun,
  verbose: true,
  version: workspaceVersion,
  versionData: projectsVersionData,
  gitCommit: true,
  gitTag: true,
  gitPush: true,
  gitRemote: 'origin',
  firstRelease,
});

// lets the release workflow deploy what was just released
if (process.env.GITHUB_OUTPUT && !dryRun) {
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${workspaceVersion}\n`);
}
