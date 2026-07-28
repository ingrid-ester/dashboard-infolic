const GRAPH_API_VERSION = "v21.0";

function getAdAccountId() {
  const id = process.env.META_AD_ACCOUNT_ID ?? "";
  return id.startsWith("act_") ? id : `act_${id}`;
}

export type DailySpend = { data: string; spend: number; leads: number };

type ActionValue = { action_type: string; value: string };

type InsightsResponse = {
  data: { date_start: string; spend: string; actions?: ActionValue[] }[];
  paging?: { next?: string };
};

// No lead-gen pixel/form is configured on this account yet — campaigns
// optimize for engagement/traffic. "link_click" is the closest available
// stand-in for "someone showed interest" until a real lead event exists
// (see the July 2026 decision to use it as "Leads" pending CRM).
function linkClickCount(actions?: ActionValue[]): number {
  const action = actions?.find((a) => a.action_type === "link_click");
  return action ? Number(action.value) : 0;
}

/**
 * Reads account-level ad spend and link clicks (used as a Leads stand-in)
 * per day for [since, until] (inclusive, "yyyy-MM-dd" strings). Follows
 * pagination in case the range is split across multiple pages.
 */
export async function getDailySpend(since: string, until: string): Promise<DailySpend[]> {
  const url = new URL(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${getAdAccountId()}/insights`,
  );
  url.searchParams.set("access_token", process.env.META_ACCESS_TOKEN ?? "");
  url.searchParams.set("fields", "spend,actions");
  url.searchParams.set("level", "account");
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("time_range", JSON.stringify({ since, until }));

  const results: DailySpend[] = [];
  let nextUrl: string | null = url.toString();

  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) {
      throw new Error(`Meta Ads API error: ${res.status} ${await res.text()}`);
    }
    const body: InsightsResponse = await res.json();
    for (const row of body.data) {
      results.push({ data: row.date_start, spend: Number(row.spend), leads: linkClickCount(row.actions) });
    }
    nextUrl = body.paging?.next ?? null;
  }

  return results;
}

export type VideoRetentionRow = {
  adId: string;
  adName: string;
  campaignName: string;
  plays: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  p100: number;
};

type VideoInsightsResponse = {
  data: {
    ad_id: string;
    ad_name: string;
    campaign_name: string;
    video_play_actions?: ActionValue[];
    video_p25_watched_actions?: ActionValue[];
    video_p50_watched_actions?: ActionValue[];
    video_p75_watched_actions?: ActionValue[];
    video_p95_watched_actions?: ActionValue[];
    video_p100_watched_actions?: ActionValue[];
  }[];
  paging?: { next?: string };
};

function videoViewCount(actions?: ActionValue[]): number {
  const action = actions?.find((a) => a.action_type === "video_view") ?? actions?.[0];
  return action ? Number(action.value) : 0;
}

type AdListResponse = {
  data: { id: string; creative?: { object_type?: string } }[];
  paging?: { next?: string };
};

// Some active ads have object_type "SHARE" (boosting an existing Page/
// Instagram post) rather than "VIDEO" (a video uploaded directly to the
// ad) — a SHARE ad can point at a static image and still log some
// video-adjacent activity, so play counts alone aren't a reliable video
// filter. Only "VIDEO" is a real video creative.
async function getActiveVideoAdIds(): Promise<Set<string>> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${getAdAccountId()}/ads`);
  url.searchParams.set("access_token", process.env.META_ACCESS_TOKEN ?? "");
  url.searchParams.set("effective_status", JSON.stringify(["ACTIVE"]));
  url.searchParams.set("fields", "id,creative{object_type}");

  const videoAdIds = new Set<string>();
  let nextUrl: string | null = url.toString();

  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) {
      throw new Error(`Meta Ads API error: ${res.status} ${await res.text()}`);
    }
    const body: AdListResponse = await res.json();
    for (const ad of body.data) {
      if (ad.creative?.object_type === "VIDEO") videoAdIds.add(ad.id);
    }
    nextUrl = body.paging?.next ?? null;
  }

  return videoAdIds;
}

/**
 * Reads the lifetime video watch curve (play count + p25/p50/p75/p95/p100
 * watched counts) for every currently active *video* ad (object_type
 * "VIDEO" — see getActiveVideoAdIds for why that's checked separately
 * from the insights call itself).
 */
export async function getActiveVideoRetention(): Promise<VideoRetentionRow[]> {
  const videoAdIds = await getActiveVideoAdIds();
  if (videoAdIds.size === 0) return [];

  const url = new URL(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${getAdAccountId()}/insights`,
  );
  url.searchParams.set("access_token", process.env.META_ACCESS_TOKEN ?? "");
  url.searchParams.set("level", "ad");
  url.searchParams.set(
    "fields",
    "ad_id,ad_name,campaign_name,video_play_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions",
  );
  url.searchParams.set(
    "filtering",
    JSON.stringify([{ field: "ad.effective_status", operator: "IN", value: ["ACTIVE"] }]),
  );
  url.searchParams.set("date_preset", "maximum");

  const results: VideoRetentionRow[] = [];
  let nextUrl: string | null = url.toString();

  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) {
      throw new Error(`Meta Ads API error: ${res.status} ${await res.text()}`);
    }
    const body: VideoInsightsResponse = await res.json();
    for (const row of body.data) {
      if (!videoAdIds.has(row.ad_id)) continue;
      const plays = videoViewCount(row.video_play_actions);
      if (plays === 0) continue;
      results.push({
        adId: row.ad_id,
        adName: row.ad_name,
        campaignName: row.campaign_name,
        plays,
        p25: videoViewCount(row.video_p25_watched_actions),
        p50: videoViewCount(row.video_p50_watched_actions),
        p75: videoViewCount(row.video_p75_watched_actions),
        p95: videoViewCount(row.video_p95_watched_actions),
        p100: videoViewCount(row.video_p100_watched_actions),
      });
    }
    nextUrl = body.paging?.next ?? null;
  }

  return results;
}

export type CreativeDailySpend = { creativeName: string; data: string; spend: number };

type AdNameListResponse = {
  data: { id: string; name: string }[];
  paging?: { next?: string };
};

// "Criativo Identificado" (from the sheet's own Mapa_Criativos lookup) is
// written to match the ad's real name in Meta Ads Manager, character for
// character (modulo whitespace) — so it can be looked up directly by name,
// no separate ID mapping table needed. More than one ad can share a name
// (e.g. re-created after a pause), so this groups by normalized name and
// keeps every matching ad id.
async function getAdsByName(names: Set<string>): Promise<Map<string, string[]>> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${getAdAccountId()}/ads`);
  url.searchParams.set("access_token", process.env.META_ACCESS_TOKEN ?? "");
  url.searchParams.set(
    "effective_status",
    JSON.stringify([
      "ACTIVE",
      "PAUSED",
      "ARCHIVED",
      "PENDING_REVIEW",
      "DISAPPROVED",
      "PREAPPROVED",
      "PENDING_BILLING_INFO",
      "CAMPAIGN_PAUSED",
      "ADSET_PAUSED",
      "IN_PROCESS",
      "WITH_ISSUES",
    ]),
  );
  url.searchParams.set("fields", "id,name");
  url.searchParams.set("limit", "500");

  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const wanted = new Map([...names].map((n) => [normalize(n), n]));
  const result = new Map<string, string[]>();

  let nextUrl: string | null = url.toString();
  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) {
      throw new Error(`Meta Ads API error: ${res.status} ${await res.text()}`);
    }
    const body: AdNameListResponse = await res.json();
    for (const ad of body.data) {
      const originalName = wanted.get(normalize(ad.name));
      if (!originalName) continue;
      const ids = result.get(originalName) ?? [];
      ids.push(ad.id);
      result.set(originalName, ids);
    }
    nextUrl = body.paging?.next ?? null;
  }

  return result;
}

type AdSpendInsightsResponse = {
  data: { ad_id: string; spend: string; date_start: string }[];
  paging?: { next?: string };
};

/**
 * Reads daily spend since `since` for exactly the given creative names —
 * matched to real ads via getAdsByName, then rolled up per name per day
 * (summing across ads that share a name).
 */
export async function getCreativeSpend(
  names: Set<string>,
  since: string,
): Promise<CreativeDailySpend[]> {
  const adIdsByName = await getAdsByName(names);
  if (adIdsByName.size === 0) return [];

  const adIdToName = new Map<string, string>();
  for (const [creativeName, adIds] of adIdsByName) {
    for (const id of adIds) adIdToName.set(id, creativeName);
  }
  const allAdIds = [...adIdToName.keys()];

  const url = new URL(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${getAdAccountId()}/insights`,
  );
  url.searchParams.set("access_token", process.env.META_ACCESS_TOKEN ?? "");
  url.searchParams.set("level", "ad");
  url.searchParams.set("fields", "ad_id,spend");
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("time_range", JSON.stringify({ since, until: new Date().toISOString().slice(0, 10) }));
  url.searchParams.set("filtering", JSON.stringify([{ field: "ad.id", operator: "IN", value: allAdIds }]));

  // creative name -> date -> spend, summed across ads that share a name.
  // Nested maps instead of a joined string key: creative names can contain
  // spaces, so a "name date" string key would be ambiguous to split back apart.
  const byNameAndDate = new Map<string, Map<string, number>>();
  let nextUrl: string | null = url.toString();
  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) {
      throw new Error(`Meta Ads API error: ${res.status} ${await res.text()}`);
    }
    const body: AdSpendInsightsResponse = await res.json();
    for (const row of body.data) {
      const creativeName = adIdToName.get(row.ad_id);
      if (!creativeName) continue;
      const byDate = byNameAndDate.get(creativeName) ?? new Map<string, number>();
      byDate.set(row.date_start, (byDate.get(row.date_start) ?? 0) + Number(row.spend));
      byNameAndDate.set(creativeName, byDate);
    }
    nextUrl = body.paging?.next ?? null;
  }

  const spend: CreativeDailySpend[] = [];
  for (const [creativeName, byDate] of byNameAndDate) {
    for (const [data, value] of byDate) {
      spend.push({ creativeName, data, spend: value });
    }
  }

  return spend;
}
