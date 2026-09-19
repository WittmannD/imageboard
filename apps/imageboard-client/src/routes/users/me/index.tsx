import { useAuth } from 'src/components/features/auth/context.tsx';
import { useGetMeQuery } from 'src/services/api/user/api.ts';
import { ProfileView } from 'src/components/features/profile/ProfileView.tsx';

function MyProfilePage() {
  const auth = useAuth(true);
  const { data: user } = useGetMeQuery();

  if (!user) {
    return null;
  }

  return (
    <ProfileView
      user={user}
      unverifiedEmail={auth.user.emailVerified ? undefined : user.email}
    />
  );
}

export default MyProfilePage;
