'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiFetch } from '@/lib/api';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['customer','provider_individual','provider_business']),
});
type FormData = z.infer<typeof schema>;


export default function RegisterPage() {
const { register, handleSubmit, formState: { errors, isSubmitting } } =
  useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'customer' }, // Sets the default for the form
    mode: 'onSubmit',
  });

  const onSubmit: SubmitHandler<FormData> = async (values) => {
    await apiFetch('/api/auth/register', { method: 'POST', json: values });
    location.href = '/';
  };

  return (
    <div className="mx-auto max-w-md animate-fadeUp card">
      <h1 className="mb-4 text-xl font-semibold">Create account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Name</label>
          <input className="input" {...register('name')} placeholder="Your name" />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input className="input" {...register('email')} placeholder="you@example.com" />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <input className="input" type="password" {...register('password')} />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm">Role</label>
          <select className="input" {...register('role')}>
            <option value="customer">Customer</option>
            <option value="provider_individual">Provider (Individual)</option>
            <option value="provider_business">Provider (Business)</option>
          </select>
          {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
        </div>
        <button disabled={isSubmitting} className="btn">
          {isSubmitting ? '...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
