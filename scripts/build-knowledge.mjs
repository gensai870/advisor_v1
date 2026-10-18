// knowledge/*.md を連結して lib/knowledge.generated.js を生成する。
// 00_ は基本指示 v4.1 の原文。編集・要約しない。
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'knowledge');
const files = readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
const read = (prefix) => {
  const f = files.find((x) => x.startsWith(prefix));
  if (!f) throw new Error(`knowledge/${prefix}*.md がありません`);
  return readFileSync(join(dir, f), 'utf8').trim();
};

const prompt = [
  'あなたはNPO法人減災教育普及協会の減災教育AIボットです。',
  '次の「基本指示 v4.1 確定版」は、すべての回答の土台です。言い換えずに、忠実に従ってください。',
  '',
  '========== 基本指示 v4.1 確定版（全文） ==========',
  read('00_'),
  '',
  '========== ナレッジ（基本指示 v4.1 と矛盾する場合は、基本指示 v4.1 を優先） ==========',
  read('10_'),
  '',
  read('20_'),
  '',
  '========== 実行時の注意 ==========',
  '- 上に書かれていないことは、推測せず「確認できていません」と答える。',
  '- 回答は日本語。操作の質問は短く、それ以外も必要以上に長くしない。',
].join('\n');

writeFileSync(
  join(root, 'lib', 'knowledge.generated.js'),
  `// 自動生成。編集しない。元: knowledge/*.md\nexport const SYSTEM_PROMPT = ${JSON.stringify(prompt)};\n`,
);
console.log(`knowledge.generated.js: ${prompt.length} 文字`);
