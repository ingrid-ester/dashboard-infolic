import type { SupabaseClient } from "@supabase/supabase-js";
import type { Period } from "./period";

export async function fetchMetaSpend(supabase: SupabaseClient, period: Period): Promise<number> {
  const { data, error } = await supabase
    .from("meta_ads_spend_raw")
    .select("spend")
    .gte("data", period.from)
    .lte("data", period.to);

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.spend), 0);
}

// "Leads" is a stand-in (link clicks) until the account has a real lead
// event configured — see getDailySpend in src/lib/meta/ads.ts.
export async function fetchMetaLeads(supabase: SupabaseClient, period: Period): Promise<number> {
  const { data, error } = await supabase
    .from("meta_ads_spend_raw")
    .select("leads")
    .gte("data", period.from)
    .lte("data", period.to);

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.leads), 0);
}

export type DailySpendPoint = { data: string; spend: number; leads: number };

export async function fetchDailySpend(supabase: SupabaseClient, period: Period): Promise<DailySpendPoint[]> {
  const { data, error } = await supabase
    .from("meta_ads_spend_raw")
    .select("data, spend, leads")
    .gte("data", period.from)
    .lte("data", period.to)
    .order("data", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({ data: row.data, spend: Number(row.spend), leads: Number(row.leads) }));
}

export type VideoRetentionRow = {
  ad_id: string;
  ad_name: string;
  campaign_name: string;
  plays: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  p100: number;
};

export async function fetchVideoRetention(supabase: SupabaseClient): Promise<VideoRetentionRow[]> {
  const { data, error } = await supabase
    .from("meta_video_retention_raw")
    .select("ad_id, ad_name, campaign_name, plays, p25, p50, p75, p95, p100")
    .order("plays", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
