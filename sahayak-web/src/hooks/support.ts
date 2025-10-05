'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Ticket, TicketDetailResponse, TicketMessage, TicketStatus } from '@/types/support';
 
export function useMyTickets() {
  return useQuery({
    queryKey: ['support','tickets','mine'],
    queryFn: async () => (await apiFetch<{ items: Ticket[] }>('/api/support/tickets?mine=1')).items ?? [],
  });
}
 
export function useAllTickets(params?: { status?: TicketStatus }) {
  const qs = params?.status ? `?status=${params.status}` : '';
  return useQuery({
    queryKey: ['support','tickets','all', params?.status ?? ''],
    queryFn: async () => (await apiFetch<{ items: Ticket[] }>(`/api/support/tickets${qs}`)).items ?? [],
  });
}
 
export function useTicket(id: string | undefined, opts?: { refetchMs?: number }) {
  return useQuery({
    queryKey: ['support','tickets', id],
    queryFn: async () => await apiFetch<TicketDetailResponse>(`/api/support/tickets/${id}`),
    enabled: !!id,
    refetchInterval: opts?.refetchMs ?? false,
  });
}
 
export function useCreateTicket() {
  return useMutation({
    mutationFn: async (input: { subject: string; categoryId?: string; message: string }) =>
      apiFetch<{ item: Ticket }>('/api/support/tickets', { method: 'POST', json: input }),
  });
}
 
export function useSendMessage(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { text: string }) =>
      apiFetch<{ item: TicketMessage }>(`/api/support/tickets/${ticketId}/messages`, { method: 'POST', json: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support','tickets', ticketId] });
    },
  });
}
 
export function useSetTicketStatus(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: TicketStatus) =>
      apiFetch<{ item: Ticket }>(`/api/support/tickets/${ticketId}/status`, { method: 'PATCH', json: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support','tickets', ticketId] }),
  });
}