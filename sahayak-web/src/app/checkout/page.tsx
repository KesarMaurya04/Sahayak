'use client';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
 
export default function CheckoutPage() {
  const sp = useSearchParams();
  const appointmentId = sp.get('appointmentId') || '';
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
 
  const createOrder = async () => {
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const r = await apiFetch('/api/payments/orders', { method: 'POST', json: { appointmentId } });
      setOrder(r);
    } catch (e: any) {
      setError(e?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="card">
      <h1 className="text-xl font-semibold">Checkout</h1>
      {!appointmentId ? (
        <p className="text-slate-600">Missing appointmentId. Go back and pick a slot.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-600">Appointment: <span className="font-mono">{appointmentId}</span></p>
          <button onClick={createOrder} disabled={loading} className="btn mt-4">
            {loading ? 'Creating order…' : 'Create Razorpay Order'}
          </button>
        </>
      )}
      {error && <p className="mt-3 text-red-600">{error}</p>}
      {order && (
        <pre className="mt-4 overflow-auto rounded-xl bg-slate-50 p-3 text-xs">
{JSON.stringify(order, null, 2)}
        </pre>
      )}
      {order && (
        <p className="mt-2 text-slate-600">
          Next: load Razorpay Checkout with <code className="font-mono">orderId</code> and your <code className="font-mono">keyId</code>.
        </p>
      )}
    </div>
  );
}