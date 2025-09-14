'use client';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export type User = { id: string; name: string; email: string; role: string };

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => (await apiFetch<{ user: User }>('/api/auth/me')).user,
    retry: false,
  });
}
