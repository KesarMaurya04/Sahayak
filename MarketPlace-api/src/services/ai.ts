import { config } from '../config';
 
const AI_PROVIDER = (process.env.AI_PROVIDER || 'ollama').toLowerCase();
 
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (AI_PROVIDER === 'openai') return embedOpenAI(texts);
  return embedOllama(texts);
}
 
export async function chatAnswer(system: string, user: string): Promise<string> {
  if (AI_PROVIDER === 'openai') return chatOpenAI(system, user);
  return chatOllama(system, user);
}
 
// ---- Ollama ----
async function embedOllama(texts: string[]): Promise<number[][]> {
  const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
  const model = process.env.OLLAMA_EMBED_MODEL || 'all-minilm';
  const res = await fetch(`${host}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: texts })
  });
  if (!res.ok) throw new Error(`Ollama embed failed: ${res.status}`);
  const data = await res.json();
  // Ollama returns { embeddings: number[][] } for multiple inputs
  return data.embeddings || data.embedding ? (data.embeddings || [data.embedding]) : [];
}
 
async function chatOllama(system: string, user: string): Promise<string> {
  const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
  const model = process.env.OLLAMA_CHAT_MODEL || 'llama3.1';
  const res = await fetch(`${host}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      stream: false
    })
  });
  if (!res.ok) throw new Error(`Ollama chat failed: ${res.status}`);
  const data = await res.json();
  return data?.message?.content || '';
}
 
// ---- OpenAI ----
async function embedOpenAI(texts: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY || '';
  if (!key) throw new Error('OPENAI_API_KEY missing');
  const model = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: texts })
  });
  if (!res.ok) throw new Error(`OpenAI embed failed: ${res.status}`);
  const data = await res.json();
  return data.data.map((d: any) => d.embedding);
}
 
async function chatOpenAI(system: string, user: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY || '';
  if (!key) throw new Error('OPENAI_API_KEY missing');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.2
    })
  });
  if (!res.ok) throw new Error(`OpenAI chat failed: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}