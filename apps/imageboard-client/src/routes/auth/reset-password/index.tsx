import type { HeadersFunction } from 'react-router';
import { ResetPasswordForm } from 'src/components/features/forms/reset-password/ResetPasswordForm.tsx';

// The page is opened from an emailed link; keep the address from leaking to
// anything it loads or links to.
export const headers: HeadersFunction = () => ({
  'Referrer-Policy': 'no-referrer',
});

function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100svh-var(--header-height))] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ResetPasswordForm />
      </div>
    </div>
  );
}

export default ResetPasswordPage;
