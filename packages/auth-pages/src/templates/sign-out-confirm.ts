import { escapeHtml } from '../html.js';
import { pageLayout } from './layout.js';

const BUTTON_BASE =
  'inline-flex w-full items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30';
const BUTTON_DESTRUCTIVE =
  'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40';
const BUTTON_OUTLINE =
  'border-border hover:bg-input/50 hover:text-foreground dark:bg-input/30';

/**
 * `form` is the hidden xsrf-only <form id="op.logoutForm"> oidc-provider
 * already built for this request - render it as-is and drive it with our
 * own styled buttons via the form="op.logoutForm" attribute, the same way
 * the library's own default template does.
 */
export function signOutConfirmPage(params: {
  host: string;
  form: string;
}): string {
  return pageLayout({
    title: 'Sign out',
    body: `
<div class="w-full rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 p-6 flex flex-col gap-4">
  <div class="flex flex-col gap-1">
    <h1 data-testid="sign-out-heading" class="text-base font-medium leading-snug">Sign out of ${escapeHtml(params.host)}?</h1>
    <p class="text-sm text-muted-foreground">You'll need to sign in again to continue.</p>
  </div>
  ${params.form}
  <div class="flex flex-col gap-2">
    <button data-testid="sign-out-confirm" autofocus type="submit" form="op.logoutForm" name="logout" value="yes" class="${BUTTON_BASE} ${BUTTON_DESTRUCTIVE}">Yes, sign me out</button>
    <button data-testid="sign-out-decline" type="submit" form="op.logoutForm" class="${BUTTON_BASE} ${BUTTON_OUTLINE}">No, stay signed in</button>
  </div>
</div>`,
  });
}
