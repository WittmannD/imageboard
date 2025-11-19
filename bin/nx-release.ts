import { ReleaseClient } from 'nx/release/index.js';

const release = new ReleaseClient({
  projects: ['apps/*'],
  projectsRelationship: 'independent',
  releaseTagPatternCheckAllBranchesWhen: false,
  version: {
    conventionalCommits: true,
  },
  changelog: {
    automaticFromRef: true,
    projectChangelogs: {
      file: false,
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

// Modify to suit your environment
const isDry = process.platform === 'darwin';

const version = await release.releaseVersion({
  dryRun: isDry,
  verbose: true,
  gitTag: true,
  gitCommit: true,
  gitPush: true,
  gitPushArgs: ['-f'],
  gitRemote: 'origin',
  firstRelease: true,
});

for (const [projectName, versionData] of Object.entries(version.projectsVersionData)) {
  const fromTag = `${projectName}@${versionData.currentVersion}`;

  // Performed when tag information is available after the first release.
  await release.releaseChangelog({
    dryRun: isDry,
    verbose: true,
    versionData: { [projectName]: versionData },
    projects: [`apps/${projectName}`],
    from: fromTag,
    to: 'HEAD',
    gitTag: false,
    gitCommit: false,
    gitPush: false,
  });
}

// await release.releasePublish({});
process.exit(0);
