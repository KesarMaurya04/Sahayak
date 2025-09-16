'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiFetch } from '@/lib/api';
import { useState } from 'react';

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    await apiFetch('/api/auth/forgot-password', { method: 'POST', json: values });
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-md card animate-fadeUp">
      <h1 className="mb-4 text-xl font-semibold">Forgot password</h1>
      {sent ? (
        <p className="text-slate-700">
          If an account exists for that email, we’ve sent a reset link. Please check your inbox.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <input className="input" {...register('email')} placeholder="you@example.com" />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <button disabled={isSubmitting} className="btn">
            {isSubmitting ? '...' : 'Send reset link'}
          </button>
        </form>
      )}
    </div>
  );
}