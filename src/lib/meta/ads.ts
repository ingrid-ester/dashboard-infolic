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

// These are Messages-objective campaigns — Meta Ads Manager's own
// "Resultados" column for that objective is messaging conversations
// started, not link clicks (a click can bounce without ever messaging).
function messagingConversationsStartedCount(actions?: ActionValue[]): number {
  const action = actions?.find((a) => a.action_type === "onsite_conversion.messaging_conversation_started_7d");
  return action ? Number(action.value) : 0;
}

/**
 * Reads account-level ad spend and messaging conversations started (used
 * as "Leads") per day for [since, until] (inclusive, "yyyy-MM-dd" strings).
 * Follows pagination in case the range is split across multiple pages.
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
      results.push({
        data: row.date_start,
        spend: Number(row.spend),
        leads: messagingConversationsStartedCount(row.actions),
      });
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

export type CreativeDailySpend = { creativeName: string; data: string; spend: number; leads: number };

type CreativeInsightsResponse = {
  data: { ad_name: string; date_start: string; spend: string; actions?: ActionValue[] }[];
  paging?: { next?: string };
};

/**
 * Reads daily spend + messaging conversations started per ad, for
 * [since, until]. No CRM yet to map ads to a curated creative list, so
 * this just groups directly by Meta's own ad name.
 */
export async function getDailyCreativeSpend(since: string, until: string): Promise<CreativeDailySpend[]> {
  const url = new URL(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${getAdAccountId()}/insights`,
  );
  url.searchParams.set("access_token", process.env.META_ACCESS_TOKEN ?? "");
  url.searchParams.set("level", "ad");
  url.searchParams.set("fields", "ad_name,spend,actions");
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("time_range", JSON.stringify({ since, until }));

  const results: CreativeDailySpend[] = [];
  let nextUrl: string | null = url.toString();
  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) {
      throw new Error(`Meta Ads API error: ${res.status} ${await res.text()}`);
    }
    const body: CreativeInsightsResponse = await res.json();
    for (const row of body.data) {
      results.push({
        creativeName: row.ad_name,
        data: row.date_start,
        spend: Number(row.spend),
        leads: messagingConversationsStartedCount(row.actions),
      });
    }
    nextUrl = body.paging?.next ?? null;
  }

  return results;
}
