import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { loadKB, KBRecord } from "./kb";

const EMBEDDING_MODEL = "text-embedding-3-small";
const CACHE_FILE = path.join("/tmp", "gensai-hinan-kb-embeddings.json");

type EmbeddedRecord = { record: KBRecord; embedding: number[] };

let memCache: EmbeddedRecord[] | null = null;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbeddedKB(client: OpenAI): Promise<EmbeddedRecord[]> {
  if (memCache) return memCache;

  if (fs.existsSync(CACHE_FILE)) {
    try {
      memCache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      return memCache!;
    } catch {}
  }

  const records = loadKB();
  const inputs = records.map((r) => `${r.title}\n${r.content}`);

  const embeddings: number[][] = [];
  for (let i = 0; i < inputs.length; i += 20) {
    const batch = inputs.slice(i, i + 20);
    const res = await client.embeddings.create({ model: EMBEDDING_MODEL, input: batch });
    embeddings.push(...res.data.map((d) => d.embedding));
  }

  memCache = records.map((record, i) => ({ record, embedding: embeddings[i] }));
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(memCache));
  } catch {}
  return memCache;
}

export async function retrieve(
  client: OpenAI,
  query: string,
  k = 4
): Promise<KBRecord[]> {
  const embeddedKB = await getEmbeddedKB(client);
  const q = await client.embeddings.create({ model: EMBEDDING_MODEL, input: query });
  const qVec = q.data[0].embedding;

  return embeddedKB
    .map((e) => ({ record: e.record, score: cosineSimilarity(qVec, e.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((e) => e.record);
}
