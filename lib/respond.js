import {
  check,
  warnings,
  normalize,
  isEmergency,
  EMERGENCY_ADDENDUM,
  EMERGENCY_FALLBACK,
  HANDOFF_FALLBACK,
} from './guard.js';

/**
 * @param {object} p
 * @param {{role:'user'|'assistant', content:string}[]} p.messages
 * @param {string} p.system         基本指示 v4.1 ほかを連結したsystemプロンプト
 * @param {(msgs:object[], opt:{temperature:number})=>Promise<string>} p.complete  モデル呼び出し（注入）
 */
export async function respond({ messages, system, complete, maxRetry = 1 }) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const emergency = isEmergency(lastUser);
  const baseSystem = emergency ? system + '\n' + EMERGENCY_ADDENDUM : system;
  const temperature = emergency ? 0.2 : 0.3;

  let sys = baseSystem;
  let text = normalize(await complete([{ role: 'system', content: sys }, ...messages], { temperature }));
  let violations = check(text, { emergency });
  let retries = 0;

  while (violations.length && retries < maxRetry) {
    retries += 1;
    sys =
      baseSystem +
      '\n\n========== 自動検査の指摘 ==========\n前回の下書きに次の問題がありました。これらを避けて書き直してください。\n- ' +
      violations.join('\n- ');
    text = normalize(await complete([{ role: 'system', content: sys }, ...messages], { temperature }));
    violations = check(text, { emergency });
  }

  if (violations.length) {
    text = emergency ? EMERGENCY_FALLBACK : HANDOFF_FALLBACK;
  }

  return {
    text,
    flags: {
      emergency,
      retries,
      fellBack: violations.length > 0,
      warnings: warnings(text, { emergency }),
    },
  };
}
