export const QUOTA_ERROR_CODE = "QUOTA_EXCEEDED";

export const QUOTA_MESSAGE = "今月の使用上限に達しました。";
export const QUOTA_SUBMESSAGE = "※追加のお支払いで上限をリセットできます。";

export function isQuotaError(err: any): boolean {
  const status = err?.status ?? err?.response?.status;
  const code = err?.code ?? err?.error?.code ?? err?.response?.data?.error?.code;
  const type = err?.type ?? err?.error?.type ?? err?.response?.data?.error?.type;

  if (code === "insufficient_quota" || type === "insufficient_quota") return true;
  if (status === 429 && (code === "insufficient_quota" || String(err?.message ?? "").includes("quota"))) {
    return true;
  }
  return false;
}
