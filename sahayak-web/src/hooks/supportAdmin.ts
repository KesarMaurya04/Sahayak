'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { AdminTicket, AdminTicketStatus, SupportArticle } from '@/types/supportadmin';

export function useAdminTickets(status?: AdminTicketStatus) {
  const qs = status ? `?status=${status}` : '';
  return useQuery({
    queryKey: ['admin','support','tickets', status ?? ''],
    queryFn: async () => (await apiFetch<{ items: AdminTicket[]; total?: number }>(`/api/support/admin/tickets${qs}`)).items ?? [],
    refetchInterval: 2500, // light polling
  });
}

// because there is no GET /admin/tickets/:id, we derive from the "all" list
export function useAdminTicket(id?: string) {
  return useQuery({
    queryKey: ['admin','support','ticket', id ?? ''],
    // fetch ALL statuses once; small MVP tradeoff
    queryFn: async () => {
      const all = (await apiFetch<{ items: AdminTicket[] }>('/api/support/admin/tickets')).items ?? [];
      return all.find(t => t._id === id);
    },
    enabled: !!id,
    refetchInterval: 2500,
  });
}

export function useAdminSetStatus(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: AdminTicketStatus) =>
      apiFetch(`/api/support/admin/tickets/${ticketId}`, { method: 'PATCH', json: { status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin','support','tickets'] });
      qc.invalidateQueries({ queryKey: ['admin','support','ticket', ticketId] });
    },
  });
}

export function useAdminReply(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) =>
      apiFetch(`/api/support/admin/tickets/${ticketId}/messages`, { method: 'POST', json: { text } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin','support','tickets'] });
      qc.invalidateQueries({ queryKey: ['admin','support','ticket', ticketId] });
    },
  });
}

// FAQ
export function useFaq() {
  return useQuery({
    queryKey: ['support','faq','active'],
    queryFn: async () => (await apiFetch<{ items: SupportArticle[] }>('/api/support/faq')).items ?? [],
  });
}

export function useCreateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; content: string; isActive?: boolean }) =>
      apiFetch('/api/support/admin/faq', { method: 'POST', json: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support','faq','active'] }),
  });
}