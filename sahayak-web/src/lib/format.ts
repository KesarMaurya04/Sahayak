export function formatMoney(n: number, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(n);
  } catch {
    return `₹ ${n}`;
  }
}
 
export function formatDateTime(d: string | number | Date) {
  const dt = new Date(d);
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dt);
}