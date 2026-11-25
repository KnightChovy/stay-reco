import { AdminTransactionDetail } from '@/features/admin/transactions/AdminTransactions';

export default async function Page({ params }: PageProps<'/admin/transactions/[id]'>) {
  const { id } = await params;
  return <AdminTransactionDetail invoiceId={id} />;
}
