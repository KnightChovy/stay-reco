import { Suspense } from 'react';
import AdminUsers from '@/features/admin/users/AdminUsers';
// AdminUsers reads `?tab=` with useSearchParams, which needs a Suspense boundary on a prerendered page.
export default function UsersPage() {
  return (
    <Suspense>
      <AdminUsers />
    </Suspense>
  );
}
