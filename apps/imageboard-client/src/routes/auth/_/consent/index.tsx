import { redirect, type LoaderFunction } from 'react-router';
import { ConsentForm } from 'src/components/features/forms/consent/ConsentForm.tsx';

interface ConsentPageLoaderData {
  uid: string;
}

export const loader: LoaderFunction = ({ request }): ConsentPageLoaderData | Response => {
  const uid = new URL(request.url).searchParams.get('uid');

  if (!uid) {
    return redirect('/');
  }

  return { uid };
};

function ConsentPage({ loaderData }: { loaderData: ConsentPageLoaderData }) {
  const { uid } = loaderData;

  return (
    <div className="flex min-h-[calc(100svh-var(--header-height))] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ConsentForm uid={uid} />
      </div>
    </div>
  );
}

export default ConsentPage;
