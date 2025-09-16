// Build a clean query string from an object
export function qs(params: Record<string, unknown>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (typeof v === 'boolean') sp.set(k, v ? 'true' : 'false');
    else sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}