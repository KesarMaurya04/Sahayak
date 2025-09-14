export async function apiFetch<T>(
  input: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const url = input.startsWith('/api') ? input : `/api${input}`;

  //  Use Headers (fully supported by fetch + TS-safe)
  const headers = new Headers(init?.headers);

  let body = init?.body;
  if (init?.json !== undefined) {
    headers.set('Content-Type', 'application/json'); 
    body = JSON.stringify(init.json);
  }

  const res = await fetch(url, {
    ...init,
    headers,
    body,
    credentials: 'include', // httpOnly cookies
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = (data as any)?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
