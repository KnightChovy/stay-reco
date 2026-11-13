import { Suspense } from 'react';
import AdminTransactions from '@/features/admin/transactions/AdminTransactions';
// AdminTransactions reads `?tab=` and `?status=` with useSearchParams, which needs a Suspense boundary.
export default function TransactionsPage() {
  return (
    <Suspense>
      <AdminTransactions />
    </Suspense>
  );
}
