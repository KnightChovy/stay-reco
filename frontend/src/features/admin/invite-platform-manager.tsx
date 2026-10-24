'use client';

import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { inviteAccountSchema } from '@stayreco/shared';
import { Input } from '@/components/ui/input';
import { FormAlert, FormField, SubmitButton } from '@/features/partner/components';
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiFieldErrors,
  validateWith,
  type FieldErrors,
} from '@/lib/api-error';
import { invitePlatformManager } from '@/services/admin.service';
import { Panel } from './admin-primitives';

export function InvitePlatformManager() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();
  const mutation = useMutation({ mutationFn: invitePlatformManager });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    setSentTo(undefined);
    const result = validateWith(inviteAccountSchema, { fullName, email });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data, {
      onSuccess: (invitation) => {
        setSentTo(invitation.email);
        setFullName('');
        setEmail('');
      },
      onError: (error) => {
        if (getApiErrorCode(error) === 'AUTH_EMAIL_TAKEN') {
          setErrors({ email: getApiErrorMessage(error) });
          return;
        }
        setErrors(getApiFieldErrors(error));
        setFormError(getApiErrorMessage(error));
      },
    });
  }

  return (
    <Panel className="p-5">
      <h2 className="font-bold text-[#013758]">Mời quản lý nền tảng</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Người được mời nhận email và tự đặt mật khẩu qua liên kết trong email.
      </p>
      <form onSubmit={handleSubmit} noValidate className="mt-4 grid gap-4 md:grid-cols-2">
        <FormField label="Họ và tên" required error={errors.fullName}>
          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
        </FormField>
        <FormField label="Email" required error={errors.email}>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
        </FormField>
        <div className="space-y-3 md:col-span-2">
          <FormAlert message={formError} />
          {sentTo && (
            <output className="block text-sm text-success">Đã gửi lời mời tới {sentTo}.</output>
          )}
          <div className="flex justify-end">
            <SubmitButton pending={mutation.isPending}>
              <Send />
              Gửi lời mời
            </SubmitButton>
          </div>
        </div>
      </form>
    </Panel>
  );
}
