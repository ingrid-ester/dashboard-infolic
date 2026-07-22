import { NextResponse } from "next/server";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveVideoRetention, getDailySpend } from "@/lib/meta/ads";

// Earliest day to backfill spend from. Bump forward only if you want to
// intentionally drop older history — the sync always re-fetches from here
// to today on every run.
const META_SPEND_SINCE = "2026-07-01";

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

const CHUNK_SIZE = 500;

// Shared by both methods: POST for manual/external triggers, GET because
// that's what Vercel Cron sends. Both check the same bearer secret — set
// CRON_SECRET in Vercel to the same value as SYNC_SECRET so the header
// Vercel attaches to cron requests passes this check.
async function handleSync(request: Request) {
  const secret = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!secret || secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const summary: Record<string, number> = {};

  const spendRows = await getDailySpend(META_SPEND_SINCE, format(new Date(), "yyyy-MM-dd"));
  if (spendRows.length > 0) {
    const { error: spendError } = await supabase
      .from("meta_ads_spend_raw")
      .upsert(spendRows, { onConflict: "data" });
    if (spendError) {
      return NextResponse.json(
        { error: `Falha ao sincronizar meta_ads_spend_raw: ${spendError.message}` },
        { status: 500 },
      );
    }
  }
  summary["meta_ads_spend"] = spendRows.length;

  const videoRetentionRows = await getActiveVideoRetention();
  const { error: deleteRetentionError } = await supabase
    .from("meta_video_retention_raw")
    .delete()
    .gt("ad_id", "");
  if (deleteRetentionError) {
    return NextResponse.json(
      { error: `Falha ao limpar meta_video_retention_raw: ${deleteRetentionError.message}` },
      { status: 500 },
    );
  }

  for (const batch of chunk(
    videoRetentionRows.map((r) => ({
      ad_id: r.adId,
      ad_name: r.adName,
      campaign_name: r.campaignName,
      plays: r.plays,
      p25: r.p25,
      p50: r.p50,
      p75: r.p75,
      p95: r.p95,
      p100: r.p100,
    })),
    CHUNK_SIZE,
  )) {
    const { error } = await supabase.from("meta_video_retention_raw").insert(batch);
    if (error) {
      return NextResponse.json(
        { error: `Falha ao sincronizar meta_video_retention_raw: ${error.message}` },
        { status: 500 },
      );
    }
  }
  summary["meta_video_retention"] = videoRetentionRows.length;

  return NextResponse.json({ ok: true, synced: summary });
}

export const GET = handleSync;
export const POST = handleSync;
