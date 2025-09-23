// Simple global toast bus (no deps)
export type ToastVariant = 'info' | 'success' | 'error';
export type ToastMsg = { id: number; message: string; variant: ToastVariant };
 
let listeners: Array<(t: ToastMsg) => void> = [];
let _id = 1;
 
export function toast(message: string, variant: ToastVariant = 'info') {
  const t: ToastMsg = { id: _id++, message, variant };
  listeners.forEach((fn) => fn(t));
}
 
export function onToast(fn: (t: ToastMsg) => void) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((f) => f !== fn); };
}