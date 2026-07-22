import type { VideoRetentionRow } from "./queries";

// Retention curve as % of plays that reached each watch mark, for
// currently active video ads (see fetchVideoRetention — the table only
// ever holds active ads, refreshed on each sync).
export function computeVideoRetention(rows: VideoRetentionRow[]) {
  const pct = (count: number, plays: number) => (plays > 0 ? (count / plays) * 100 : 0);

  return rows.map((row) => ({
    adName: row.ad_name,
    campaignName: row.campaign_name,
    plays: row.plays,
    p25: pct(row.p25, row.plays),
    p50: pct(row.p50, row.plays),
    p75: pct(row.p75, row.plays),
    p95: pct(row.p95, row.plays),
    p100: pct(row.p100, row.plays),
  }));
}
