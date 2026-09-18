import { AdminShell } from '@/components/features/admin/admin-shell';

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return <AdminShell>{children}</AdminShell>;
}
