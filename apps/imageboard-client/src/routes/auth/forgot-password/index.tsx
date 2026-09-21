import { ForgotPasswordForm } from 'src/components/features/forms/forgot-password/ForgotPasswordForm.tsx';

function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100svh-var(--header-height))] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
