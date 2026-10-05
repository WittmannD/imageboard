import { buildInfo, commitUrl, shortCommit } from 'src/lib/build-info.ts';
import { SITE_NAME } from 'src/lib/utils/meta.ts';

function Footer() {
  return (
    <footer className="w-full border-t">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4 text-xs text-muted-foreground">
        <span>{SITE_NAME}</span>
        <span data-testid="footer-version">
          v{buildInfo.version}
          {shortCommit && commitUrl && (
            <>
              {' · '}
              <a
                href={commitUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono hover:text-foreground hover:underline"
                title={buildInfo.commit ?? undefined}
              >
                {shortCommit}
              </a>
            </>
          )}
        </span>
      </div>
    </footer>
  );
}

export { Footer };
