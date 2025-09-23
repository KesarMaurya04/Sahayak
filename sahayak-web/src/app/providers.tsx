'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useMemo } from 'react';
import ToastContainer from '@/components/ToastContainer';

export default function Providers({ children }: { children: ReactNode }) {
  const client = useMemo(() => new QueryClient(), []);
  
return (
    <QueryClientProvider client={client}>
      {children}
      <ToastContainer /> 
    </QueryClientProvider>
  );
  
}
