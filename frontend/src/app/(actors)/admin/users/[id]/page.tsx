import { AdminScreen } from '@/components/features/admin/admin-screen';
export default async function UserDetailPage({
  params,
}: PageProps<'/admin/users/[id]'>) {
  const { id } = await params;
  return <AdminScreen mode="user-detail" id={id} />;
}
