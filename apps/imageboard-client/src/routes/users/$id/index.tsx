import { useParams } from 'react-router';
import { useGetUserQuery } from 'src/services/api/user/api.ts';
import { ProfileView } from 'src/components/features/profile/ProfileView.tsx';

function UserProfilePage() {
  const params = useParams();
  const userId = Number(params['id']);

  const { data: user } = useGetUserQuery(userId);

  if (!user) {
    return null;
  }

  return <ProfileView user={user} />;
}

export default UserProfilePage;
