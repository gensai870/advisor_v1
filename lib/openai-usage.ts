type CostsResponse = {
  data: {
    results: { amount?: { value: number; currency: string } }[];
  }[];
  has_more: boolean;
  next_page: string | null;
};

function monthStartUnix(): number {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  return Math.floor(start.getTime() / 1000);
}

export async function fetchMonthlyCostUSD(adminApiKey: string): Promise<number> {
  const startTime = monthStartUnix();
  let total = 0;
  let page: string | null = null;

  for (let i = 0; i < 10; i++) {
    const url = new URL("https://api.openai.com/v1/organization/costs");
    url.searchParams.set("start_time", String(startTime));
    url.searchParams.set("bucket_width", "1d");
    url.searchParams.set("limit", "31");
    if (page) url.searchParams.set("page", page);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${adminApiKey}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenAI Costs API error (${res.status}): ${body}`);
    }

    const json = (await res.json()) as CostsResponse;
    for (const bucket of json.data ?? []) {
      for (const r of bucket.results ?? []) {
        total += r.amount?.value ?? 0;
      }
    }

    if (!json.has_more || !json.next_page) break;
    page = json.next_page;
  }

  return total;
}
