import { AdminScreen } from '@/components/features/admin/admin-screen';
export default async function TransactionDetailPage({
  params,
}: PageProps<'/admin/transactions/[id]'>) {
  const { id } = await params;
  return <AdminScreen mode="transaction-detail" id={id} />;
}
