'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { useMemo } from 'react';

const schema = z.object({
  password: z.string().min(6),
  confirm: z.string().min(6),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get('token') || '';
  const email = sp.get('email') || '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const disabled = useMemo(() => !token || !email, [token, email]);

  const onSubmit = async (values: FormData) => {
    if (disabled) return;
    await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      json: { email, token, password: values.password },
    });
    // success -> go login
    router.push('/login');
  };

  return (
    <div className="mx-auto max-w-md card animate-fadeUp">
      <h1 className="mb-4 text-xl font-semibold">Reset password</h1>
      {disabled ? (
        <p className="text-red-600">Invalid reset link. Please use the latest link from your email.</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">New password</label>
            <input className="input" type="password" {...register('password')} />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm">Confirm password</label>
            <input className="input" type="password" {...register('confirm')} />
            {errors.confirm && <p className="mt-1 text-sm text-red-600">{errors.confirm.message}</p>}
          </div>
          <button disabled={isSubmitting} className="btn">
            {isSubmitting ? '...' : 'Set new password'}
          </button>
        </form>
      )}
    </div>
  );
}