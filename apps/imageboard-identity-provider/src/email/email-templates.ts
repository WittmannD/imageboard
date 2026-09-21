export const accountVerificationEmail = `
<p>Please complete registration by entering the one-time password below.</p>
<p style="font-size: 2rem; letter-spacing: 0.3rem"><code>{{otp}}</code></p>
<br />
<p>This password expires in {{expiresIn}}.</p>
`

export const passwordResetEmail = `
<p>We received a request to reset the password for your account. Use the link below to choose a new one.</p>
<p><a href="{{{link}}}">Reset your password</a></p>
<p>If the link doesn't open, copy this address into your browser:<br />{{{link}}}</p>
<p>The link can only be used once and expires in {{expiresIn}}. If you didn't ask for this, you can safely ignore this email.</p>
`

export const passwordChangedEmail = `
<p>The password for your account was just changed.</p>
<p>If this was you, there's nothing more to do. If it wasn't, reset your password again right away.</p>
`
