import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieve } from "@/lib/embeddings";
import { isQuotaError, QUOTA_ERROR_CODE } from "@/lib/openai-errors";

export const runtime = "nodejs";

const CHAT_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `あなたは「NPO法人日本減災教育普及協会」の会員施設（保育・幼児教育施設）向けAIアシスタントです。
「避難訓練2.0」の考え方・帳票・訓練設計・研修について、会員施設の職員からの質問に答えます。

必ず守ること:
- 「２年間計画」「１のシート」など、帳票①〜④を指すと思われる言い方は、帳票の意味で解釈する（注記がある場合はそれに従う）。「２年間」を文字どおりの2年間の計画とは解釈しない。
- まず、続けて渡される「参考情報」に質問に関係する内容があるか確認する。関係する内容があれば、それを最優先の根拠として回答する。
- 帳票①〜④の項目・選択肢、研修の段階・内容、教材、協会の制度・料金・日程・連絡先など、協会固有の事柄は、参考情報にない場合に一般知識で補わない。推測せず「確認できていません。協会にお尋ねください」と答える。
- 協会固有でない一般的な保育・防災の質問で参考情報が不十分な場合は、あなた自身の一般的な知識で誠実に回答してよい。ただし、断定的すぎる医療・法律・行政の公式見解は避け、必要に応じて「詳細は専門機関・自治体にご確認ください」と添える。
- 保育・幼児教育施設向けの実務的な言葉づかいで、簡潔に答える。

協会の考え方（用語・言い回しを変えない）:
- 中心の考え方は「被害起点防災」、原理は「答えは問題で決まる」。問題＝その場所で何が起こり誰にどんな被害が生じ得るか、答え＝対策や行動。「正解は被害が決める」は中心原理として使わない。
- 協会のメッセージ：「答えを教えるだけの防災教育から、問題を考える減災教育へ。」
- 「減災教育」は協会が作った言葉ではない。「協会が提唱する」とは言わず「協会が考える」「協会が取り組む」と言う。協会独自のものは「被害起点防災」と「避難訓練2.0」（英語名 Risk to Action）。
- 用語は「残留リスク」。安全とは「許容できないリスクがないこと」で、危険ゼロではない。
- 研修は4段階：①基礎研修②実践研修③実装研修④評価・改善研修。「現場実践」は使わない。
- 4力は「予測・認知・判断・行動」（順番・名前は変えない）。一度で終わらず再認知・再判断を繰り返す。
- 答えを教えること自体は否定しない。先生・担当者個人を責めず、教え方・訓練・評価の仕組みの問題として説明する。子どもを受け身の存在として描かない。
- 「この姿勢・この訓練・この対策をすれば安全」と保証しない。姿勢（ダンゴムシ・カエル・トカゲ）は場所の危険に合わせて使い分けるもので、トカゲのポーズはヨガではなく協会が考案した地震時の姿勢。
- 今まさに災害が起きている質問には、問い返さず、身を守る行動と公式情報（テレビ・ラジオ、自治体、気象庁）の確認を最優先で案内する。
- 建物の耐震性・医療・法令への適合は判断せず、専門家や所管機関への確認を案内する。数値・地名・震度・被害想定は推測で補わない。

- 回答が「参考情報」の内容を実際に根拠として使った場合のみ、回答の最後に一言「（減災教育普及協会推奨）」と付け加える。参考情報を使わず一般知識のみで回答した場合は、この一言は付けない。
- 参考情報に source_doc が「追加候補・要すり合わせ」と注記されている内容を使う場合は、「※この項目は理事長確認中のドラフト内容です」と必ず一言添える。
- 「中規模/大規模の地震動」（建築基準法上の耐震設計用語）と、避難訓練2.0の「想定地震名・マグニチュード・想定震度・想定被害」は別概念なので混同しない。
- 学校施設向けの法令・点検基準（消防法・建築基準法等）は、保育・幼児教育施設に同じ法的義務があるとは限らない点に注意して説明する。
- 医療的な助言（体調不良時の対応の医学的妥当性など）は行わず、YURETA運営者の安全運用基準として案内するにとどめる。`;


// 帳票番号の表記ゆれ（②/２/2、①シート/１のシート 等）を吸収する
const FORM_NAMES: Record<string, string> = {
  "①": "被害想定・減災設計シート",
  "②": "年間避難訓練計画",
  "③": "避難訓練 実施・評価・改善シート",
  "④": "年間評価・次年度改善シート",
};
function normalizeFormQuery(text: string): { query: string; content: string } {
  if (/[①②③④]/.test(text)) return { query: text, content: text };
  const n = text.normalize("NFKC");
  let mark: string | null = null;
  if (/(^|[^0-9])2\s*年間\s*(避難)?\s*(訓練)?\s*計画/.test(n)) mark = "②";
  else if (/(^|[^0-9])([134])\s*(番の|番目の|つ目の|の)?\s*(シート|帳票)/.test(n)) {
    const d = n.match(/([134])\s*(番の|番目の|つ目の|の)?\s*(シート|帳票)/)![1];
    mark = ({ "1": "①", "3": "③", "4": "④" } as Record<string, string>)[d];
  }
  if (!mark) return { query: text, content: text };
  const note = `（※「${text}」は、帳票${mark}「${FORM_NAMES[mark]}」のことを指しています）`;
  return { query: `${text} 帳票${mark} ${FORM_NAMES[mark]}`, content: `${text}\n${note}` };
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY が設定されていません。" },
        { status: 500 }
      );
    }
    const client = new OpenAI({ apiKey });

    const { messages } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
    };
    if (!messages?.length) {
      return NextResponse.json({ error: "messages は必須です。" }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMessage) {
      return NextResponse.json({ error: "user メッセージが見つかりません。" }, { status: 400 });
    }

    const norm = normalizeFormQuery(lastUserMessage.content);
    const contextRecords = await retrieve(client, norm.query, 6);
    const contextText = contextRecords
      .map(
        (r) =>
          `【id: ${r.id}】【${r.chapter_no ?? r.part} ${r.title}】(source_doc: ${r.source_doc})\n${r.content}`
      )
      .join("\n\n---\n\n");

    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `参考情報:\n\n${contextText}` },
        ...messages.map((m) => (m === lastUserMessage ? { ...m, content: norm.content } : m)),
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({
      reply,
      sources: contextRecords.map((r) => ({ id: r.id, chapter_no: r.chapter_no, title: r.title })),
    });
  } catch (err: any) {
    console.error(err);
    if (isQuotaError(err)) {
      return NextResponse.json({ error: QUOTA_ERROR_CODE }, { status: 429 });
    }
    return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}
