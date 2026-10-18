import type { DocSection } from "./plan-document";

function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function kvTableHtml(rows: [string, string][]): string {
  const body = rows
    .map(
      ([label, value]) =>
        `<tr><th>${esc(label)}</th><td>${esc(value).replace(/\n/g, "<br/>")}</td></tr>`
    )
    .join("");
  return `<table class="kv">${body}</table>`;
}

function dataTableHtml(headers: string[], rows: string[][]): string {
  const head = `<tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>`;
  const body = rows
    .map((r) => `<tr>${r.map((v) => `<td>${esc(v).replace(/\n/g, "<br/>")}</td>`).join("")}</tr>`)
    .join("");
  return `<table class="data"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

export function buildPlanHtml(sections: DocSection[], title: string): string {
  const body = sections
    .map((s) => {
      if (s.type === "h1") return `<h1>${esc(s.text)}</h1>`;
      if (s.type === "h2") return `<h2>${esc(s.text)}</h2>`;
      if (s.type === "p") return `<p>${esc(s.text)}</p>`;
      if (s.type === "note") return `<p class="note">${esc(s.text)}</p>`;
      if (s.type === "kv") return kvTableHtml(s.rows);
      if (s.type === "table") return dataTableHtml(s.headers, s.rows);
      return "";
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  body { font-family: "Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif; color: #222; max-width: 900px; margin: 40px auto; padding: 0 16px; line-height: 1.7; }
  h1 { font-size: 20px; border-bottom: 2px solid #e8604c; padding-bottom: 6px; margin-top: 40px; }
  h2 { font-size: 15px; color: #e8604c; margin-top: 24px; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0 20px; font-size: 13px; }
  table.kv th { width: 28%; text-align: left; background: #f7f8f9; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; }
  .note { font-size: 12px; color: #888; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}
