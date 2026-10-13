'use client';

import { useState } from 'react';
import { Notice } from '@/features/admin/admin-primitives';
import { Dashboard } from '@/features/admin/screens/dashboard-screen';
import { UsersPage } from '@/features/admin/screens/users-screen';
import { UserDetail } from '@/features/admin/screens/user-detail-screen';
import { PaymentSettings } from '@/features/admin/screens/payment-settings-screen';
import { TransactionsPage } from '@/features/admin/screens/transactions-screen';
import { TransactionDetail } from '@/features/admin/screens/transaction-detail-screen';
import { LogsPage } from '@/features/admin/screens/logs-screen';
import { AiSettings } from '@/features/admin/screens/ai-settings-screen';

type Mode =
  | 'dashboard'
  | 'users'
  | 'user-detail'
  | 'payment-settings'
  | 'transactions'
  | 'transaction-detail'
  | 'logs'
  | 'ai-settings';

export function AdminScreen({ mode, id }: { mode: Mode; id?: string }) {
  const [notice, setNotice] = useState('');
  const notify = (message: string) => setNotice(message);
  const screens = {
    dashboard: <Dashboard notify={notify} />,
    users: <UsersPage notify={notify} />,
    'user-detail': <UserDetail id={id} notify={notify} />,
    'payment-settings': <PaymentSettings notify={notify} />,
    transactions: <TransactionsPage notify={notify} />,
    'transaction-detail': <TransactionDetail id={id} notify={notify} />,
    logs: <LogsPage notify={notify} />,
    'ai-settings': <AiSettings notify={notify} />,
  };

  return (
    <>
      {screens[mode]}
      {notice && <Notice message={notice} onClose={() => setNotice('')} />}
    </>
  );
}
