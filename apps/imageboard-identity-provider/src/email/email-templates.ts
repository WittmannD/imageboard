export const accountVerificationEmail = `
<p>Please complete registration by clicking the button below.</p>
<p><a style="display: block; padding: 6px 8px; border: 1px solid black; text-decoration: none" href="{{verificationUrl}}">Verify email</a></p>
<br />
<p>If the button above doesn't work, copy and paste the URL below into your browser's address bar:</p>
<code>{{verificationUrl}}</code>
<br />
<p>This link expires in {{expiresIn}}.</p>
`