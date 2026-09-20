import { darkModeScript } from '../assets/dark-mode-script.js';
import { logo } from '../assets/logo.js';
import { compiledStyles } from '../get-styles.js';

export function pageLayout(params: { title: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${params.title}</title>
<script>${darkModeScript}</script>
<style>${compiledStyles}</style>
</head>
<body class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
<div class="w-full max-w-sm flex flex-col items-center gap-6">
${logo('h-9 text-foreground')}
${params.body}
</div>
</body>
</html>`;
}
