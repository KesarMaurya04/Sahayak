import { SupportArticle } from '../models/Support';
import { SupportEmbedding } from '../models/SupportEmbedding';
import { embedTexts } from './ai';

const TOP_K = Number(process.env.RAG_TOP_K || 5);
const MIN_SIM = Number(process.env.RAG_MIN_SIM || 0.72);

function chunkText(title: string, body: string): string[] {
  // Simple chunker: split by paragraphs, cap length ~800 chars
  const base = `${title}\n\n${body}`.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  const chunks: string[] = [];
  for (const para of base) {
    if (para.length <= 800) { chunks.push(para); continue; }
    for (let i=0; i<para.length; i+=800) chunks.push(para.slice(i, i+800));
  }
  return chunks;
}

export async function ensureSupportIndex(): Promise<void> {
  const countArticles = await SupportArticle.countDocuments({ isActive: true });
  const countEmb = await SupportEmbedding.estimatedDocumentCount();
  if (countEmb > 0 && countEmb >= countArticles) return; // naive check

  // Rebuild (simple: clear and recreate)
  await SupportEmbedding.deleteMany({});
  const articles = await SupportArticle.find({ isActive: true });

  for (const art of articles) {
    const chunks = chunkText(art.title, art.body);
    if (!chunks.length) continue;
    const vecs = await embedTexts(chunks);
    const docs = chunks.map((text, i) => ({
      articleId: art._id,
      chunkIndex: i,
      text,
      embedding: vecs[i]
    }));
    if (docs.length) await SupportEmbedding.insertMany(docs, { ordered: false });
  }
}

function cosine(a: number[], b: number[]) {
  let dot=0, na=0, nb=0;
  for (let i=0;i<a.length;i++){ const x=a[i], y=b[i]; dot+=x*y; na+=x*x; nb+=y*y; }
  const denom = Math.sqrt(na)*Math.sqrt(nb) || 1;
  return dot/denom;
}

export async function retrieveContext(question: string) {
  const [qVec] = await embedTexts([question]);
  const docs = await SupportEmbedding.find().limit(5000); // fine for small KB
  const scored = docs.map(d => ({
    articleId: d.articleId.toString(),
    text: d.text,
    sim: cosine(qVec, d.embedding as number[])
  })).sort((a,b)=> b.sim - a.sim).slice(0, TOP_K);

  const context = scored.map(s => `• ('${s.sim.toFixed(2)}') ${s.text}`).join('\n');
  const topSim = scored[0]?.sim ?? 0;
  return { context, topSim, scored };
}

export function belowConfidence(topSim: number) {
  return topSim < MIN_SIM;
}

export function buildPrompt() {
  const system =
`You are a helpful support assistant for a services marketplace.
Answer ONLY using the provided context. If the answer is not in context, say you are not sure and suggest creating a ticket.
Be concise, step-by-step where helpful.`;

  return system;
}