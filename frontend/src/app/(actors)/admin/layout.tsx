import { AdminShell } from '@/features/admin/admin-shell';
import '@/features/admin/admin.css';

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return <AdminShell>{children}</AdminShell>;
}
