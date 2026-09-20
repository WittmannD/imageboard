import { escapeHtml } from '../html.js';
import { pageLayout } from './layout.js';

export function signOutSuccessPage(params: { clientName?: string }): string {
  const scoped = params.clientName ? ` with ${escapeHtml(params.clientName)}` : '';

  return pageLayout({
    title: 'Signed out',
    body: `
<div class="w-full rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 p-6 flex flex-col gap-1 text-center">
  <h1 class="text-base font-medium leading-snug">You're signed out</h1>
  <p class="text-sm text-muted-foreground">Your sign-out${scoped} was successful.</p>
</div>`,
  });
}
