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

export async function fetchMetaLeads(supabase: SupabaseClient, period: Period): Promise<number> {
  const { data, error } = await supabase
    .from("meta_ads_spend_raw")
    .select("leads")
    .gte("data", period.from)
    .lte("data", period.to);

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.leads), 0);
}

export type DailyLeadsPoint = { data: string; leads: number };

export async function fetchDailyLeads(supabase: SupabaseClient, period: Period): Promise<DailyLeadsPoint[]> {
  const { data, error } = await supabase
    .from("meta_ads_spend_raw")
    .select("data, leads")
    .gte("data", period.from)
    .lte("data", period.to)
    .order("data", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({ data: row.data, leads: Number(row.leads) }));
}

export type CreativeRankingRow = { creativeName: string; investimento: number; leads: number; cpl: number | null };

export async function fetchCreativeRanking(supabase: SupabaseClient, period: Period): Promise<CreativeRankingRow[]> {
  const { data, error } = await supabase
    .from("meta_creative_spend_raw")
    .select("creative_name, spend, leads")
    .gte("data", period.from)
    .lte("data", period.to);

  if (error) throw error;

  const byName = new Map<string, { investimento: number; leads: number }>();
  for (const row of data ?? []) {
    const agg = byName.get(row.creative_name) ?? { investimento: 0, leads: 0 };
    agg.investimento += Number(row.spend);
    agg.leads += Number(row.leads);
    byName.set(row.creative_name, agg);
  }

  return [...byName.entries()]
    .map(([creativeName, agg]) => ({
      creativeName,
      investimento: agg.investimento,
      leads: agg.leads,
      cpl: agg.leads > 0 ? agg.investimento / agg.leads : null,
    }))
    .sort((a, b) => b.investimento - a.investimento);
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
