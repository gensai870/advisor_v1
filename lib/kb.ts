import fs from "fs";
import path from "path";

export type KBRecord = {
  id: string;
  part: string | null;
  chapter_no: string | null;
  title: string;
  content: string;
  category: string;
  importance: string | null;
  tags: string[];
  source_doc: string;
  last_updated: string;
};

let cached: KBRecord[] | null = null;

export function loadKB(): KBRecord[] {
  if (cached) return cached;
  const file = path.join(process.cwd(), "data", "gensai_hinan20_knowledge_base.jsonl");
  const lines = fs.readFileSync(file, "utf-8").split("\n").filter((l) => l.trim());
  cached = lines.map((l) => JSON.parse(l));
  return cached;
}
